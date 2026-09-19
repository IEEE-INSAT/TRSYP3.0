import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentProofStatus } from '@prisma/client';

/**
 * One submitted proof, as its owner sees it.
 *
 * `storagePath` is deliberately absent: the object is private and reached
 * through a signed URL from `GET /payment/proof/:id/file`, never by path.
 */
export class PaymentProofResponseDto {
  @ApiProperty({ description: 'Proof ID', format: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'How the participant paid', enum: PaymentMethod })
  @Expose()
  method!: PaymentMethod;

  @ApiProperty({ description: 'Review state', enum: PaymentProofStatus })
  @Expose()
  status!: PaymentProofStatus;

  @ApiProperty({ description: 'Fee at the time of submission, in TND' })
  @Expose()
  amountSnapshot!: number;

  @ApiPropertyOptional({
    description: 'Original receipt filename. Absent for a cash payment.',
    nullable: true,
  })
  @Expose()
  fileName!: string | null;

  @ApiProperty({
    description:
      'Whether a receipt is stored. False for cash, which an admin confirms in person.',
  })
  @Expose()
  hasFile!: boolean;

  @ApiPropertyOptional({
    description: 'Why the proof was rejected, when it was',
    nullable: true,
  })
  @Expose()
  rejectionReason!: string | null;

  @ApiPropertyOptional({ description: 'When an admin reviewed it', nullable: true })
  @Expose()
  reviewedAt!: Date | null;

  @ApiProperty({ description: 'Submission timestamp', format: 'date-time' })
  @Expose()
  createdAt!: Date;
}

/**
 * `GET /payment/proof/me` - everything the dashboard needs to show where a
 * participant stands, in one call.
 *
 * `paid` is the authoritative settled flag; `latestProof` explains what is
 * happening in between. Together they let the UI derive Not Paid / Pending /
 * Paid without keeping any state of its own.
 */
export class MyPaymentResponseDto {
  @ApiProperty({ description: 'Whether the fee is settled' })
  @Expose()
  paid!: boolean;

  @ApiProperty({ description: 'Current fee for this participant, in TND' })
  @Expose()
  fee!: number;

  @ApiProperty({ description: 'Currency of every amount here' })
  @Expose()
  currency!: string;

  @ApiProperty({ description: 'Whether proof submission is open right now' })
  @Expose()
  submissionOpen!: boolean;

  @ApiPropertyOptional({
    description: 'Most recent proof, if any has been submitted',
    type: PaymentProofResponseDto,
    nullable: true,
  })
  @Expose()
  @Type(() => PaymentProofResponseDto)
  latestProof!: PaymentProofResponseDto | null;
}

/** A proof in the admin queue, with enough identity to review it. */
export class AdminPaymentProofResponseDto extends PaymentProofResponseDto {
  @ApiProperty({ description: 'Participant ID', format: 'uuid' })
  @Expose()
  participantId!: string;

  @ApiProperty({ description: 'Participant full name' })
  @Expose()
  participantName!: string;

  @ApiProperty({ description: 'Participant email' })
  @Expose()
  participantEmail!: string;

  @ApiProperty({
    description:
      'Fee the participant owes right now. Differs from amountSnapshot when they changed tier or joined a team after submitting.',
  })
  @Expose()
  currentFee!: number;

  @ApiProperty({ description: 'Whether the participant is already marked paid' })
  @Expose()
  participantPaid!: boolean;
}

/** Paged admin queue, mirroring the participant list response. */
export class PaymentProofListResponseDto {
  @ApiProperty({ description: 'Proofs matching the filters', type: [AdminPaymentProofResponseDto] })
  @Expose()
  @Type(() => AdminPaymentProofResponseDto)
  data!: AdminPaymentProofResponseDto[];

  @ApiProperty({ description: 'Total number of proofs matching filters' })
  @Expose()
  total!: number;

  @ApiProperty({ description: 'Number of items skipped' })
  @Expose()
  skip!: number;

  @ApiProperty({ description: 'Number of items returned' })
  @Expose()
  take!: number;
}

/** A short-lived link to a stored receipt. */
export class ProofFileUrlResponseDto {
  @ApiProperty({ description: 'Signed URL to the receipt' })
  @Expose()
  url!: string;

  @ApiProperty({ description: 'Seconds until the URL stops working' })
  @Expose()
  expiresIn!: number;
}
