import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  PROOF_BUCKET,
  PROOF_SIGNED_URL_TTL_SECONDS,
} from '../domain';

/**
 * Payment receipts in Supabase Storage.
 *
 * The bucket is private and reached with the service-role key, so it is only
 * ever touched from here - the browser never holds a credential that can read
 * it. Callers get a signed URL that expires in a minute instead of a path.
 */
@Injectable()
export class ProofStorageService {
  private readonly logger = new Logger(ProofStorageService.name);
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !key) {
      // Both are required by the Joi schema in AppModule, so reaching this
      // means the process was started around that validation.
      throw new Error('Supabase credentials are required for payment proofs');
    }

    this.supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /**
   * Store a receipt and return its object path.
   *
   * The path is keyed by proof id, so a resubmission never collides with the
   * row it replaces even when both are the same file type.
   */
  async upload(
    participantId: string,
    proofId: string,
    extension: string,
    file: Buffer,
    mimeType: string,
  ): Promise<string> {
    const path = `${participantId}/${proofId}.${extension}`;

    const { error } = await this.supabase.storage
      .from(PROOF_BUCKET)
      .upload(path, file, { contentType: mimeType, upsert: true });

    if (error) {
      this.logger.error(`Failed to upload proof to ${path}: ${error.message}`);
      throw new InternalServerErrorException('Could not store the payment proof');
    }

    return path;
  }

  /**
   * Mint a short-lived download link.
   *
   * @throws InternalServerErrorException if the object is missing - a row
   *         pointing at nothing is a bug worth surfacing, not a silent null.
   */
  async signedUrl(path: string): Promise<{ url: string; expiresIn: number }> {
    const { data, error } = await this.supabase.storage
      .from(PROOF_BUCKET)
      .createSignedUrl(path, PROOF_SIGNED_URL_TTL_SECONDS);

    if (error || !data) {
      this.logger.error(`Failed to sign ${path}: ${error?.message ?? 'no data'}`);
      throw new InternalServerErrorException('Could not open the payment proof');
    }

    return { url: data.signedUrl, expiresIn: PROOF_SIGNED_URL_TTL_SECONDS };
  }

  /**
   * Drop a stored receipt.
   *
   * Best effort: a failure here is logged and swallowed, because it is always
   * called while replacing a proof and losing the new submission over a stale
   * object left behind would be the worse outcome. The bucket holds at most
   * one object per participant by design, so a leak costs little.
   */
  async remove(path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(PROOF_BUCKET).remove([path]);

    if (error) {
      this.logger.warn(`Could not delete superseded proof ${path}: ${error.message}`);
    }
  }
}
