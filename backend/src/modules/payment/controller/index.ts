import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { PaymentMethod, PaymentProofStatus } from '@prisma/client';
import { PaymentService, ProofWithParticipant, UploadedProof } from '../service';
import { FEE_CURRENCY } from '../../registration/domain';
import { MAX_PROOF_BYTES } from '../domain';
import {
  SubmitProofSchema,
  RejectProofDto,
  RejectProofSchema,
  PaymentProofResponseDto,
  MyPaymentResponseDto,
  AdminPaymentProofResponseDto,
  PaymentProofListResponseDto,
  ProofFileUrlResponseDto,
} from '../dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { CurrentUser, Roles } from '../../../common/decorators';
import { ZodValidationPipe } from '../../../common/pipes';

/**
 * Payment proofs.
 *
 * `Participant.paid` remains the settled flag; everything here is the trail
 * that leads to it being flipped. Receipts live in a private bucket and are
 * only ever handed out as short-lived signed URLs.
 */
@ApiTags('payment')
@ApiBearerAuth()
@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /** Proof row -> participant-facing response. */
  private toProofResponse(proof: {
    id: string;
    method: PaymentMethod;
    status: PaymentProofStatus;
    amountSnapshot: number;
    fileName: string | null;
    storagePath: string | null;
    rejectionReason: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
  }): PaymentProofResponseDto {
    return plainToInstance(
      PaymentProofResponseDto,
      { ...proof, hasFile: proof.storagePath !== null },
      { excludeExtraneousValues: true },
    );
  }

  /** Proof row -> admin response, with who owes what. */
  private toAdminProofResponse(
    proof: ProofWithParticipant,
  ): AdminPaymentProofResponseDto {
    const { participant } = proof;
    return plainToInstance(
      AdminPaymentProofResponseDto,
      {
        ...proof,
        hasFile: proof.storagePath !== null,
        participantId: participant.id,
        participantName: `${participant.user.name} ${participant.user.lastName}`.trim(),
        participantEmail: participant.user.email,
        currentFee: this.paymentService.feeFor(participant),
        participantPaid: participant.paid,
      },
      { excludeExtraneousValues: true },
    );
  }

  // ==========================================================================
  // PARTICIPANT ROUTES
  // ==========================================================================

  /**
   * Submit a proof of payment.
   *
   * Multipart, because the receipt travels with the method. Cash is the one
   * method that may arrive without a file.
   */
  @Post('proof')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_PROOF_BYTES, files: 1 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit a payment proof' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['method'],
      properties: {
        method: { type: 'string', enum: Object.values(PaymentMethod) },
        file: {
          type: 'string',
          format: 'binary',
          description: 'JPG, PNG or PDF up to 3 MB. Optional for CASH only.',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Proof submitted and awaiting review' })
  @ApiResponse({ status: 400, description: 'Missing receipt or invalid method' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Submission closed, or participant banned' })
  @ApiResponse({ status: 409, description: 'Already paid, or a proof is under review' })
  @ApiResponse({ status: 413, description: 'Receipt larger than 3 MB' })
  @ApiResponse({ status: 415, description: 'Receipt is not a JPG, PNG or PDF' })
  async submitProof(
    @CurrentUser('sub') userId: string,
    @Body('method', new ZodValidationPipe(SubmitProofSchema.shape.method))
    method: PaymentMethod,
    @UploadedFile() file?: UploadedProof,
  ): Promise<PaymentProofResponseDto> {
    const proof = await this.paymentService.submitProof(userId, method, file);
    return this.toProofResponse(proof);
  }

  /**
   * Where this participant stands.
   *
   * One call, so the dashboard can derive Not Paid / Pending / Paid without
   * holding any state of its own.
   */
  @Get('proof/me')
  @ApiOperation({ summary: 'Get my payment status and latest proof' })
  @ApiResponse({ status: 200, description: 'Payment status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyPayment(
    @CurrentUser('sub') userId: string,
  ): Promise<MyPaymentResponseDto> {
    const { participant, proof } = await this.paymentService.latestProofForUser(userId);

    return plainToInstance(
      MyPaymentResponseDto,
      {
        paid: participant.paid,
        fee: this.paymentService.feeFor(participant),
        currency: FEE_CURRENCY,
        submissionOpen: this.paymentService.isSubmissionOpen(),
        latestProof: proof ? this.toProofResponse(proof) : null,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Open a stored receipt.
   *
   * Owner or admin only - a participant may re-read what they sent, which is
   * also what the dashboard uses to show them their own receipt back.
   */
  @Get('proof/:id/file')
  @ApiOperation({ summary: 'Get a signed URL for a stored receipt' })
  @ApiParam({ name: 'id', description: 'Proof ID' })
  @ApiResponse({ status: 200, description: 'Signed URL, valid for 60 seconds' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not your proof' })
  @ApiResponse({ status: 404, description: 'Proof not found, or it has no receipt' })
  async getProofFile(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProofFileUrlResponseDto> {
    const proof = await this.paymentService.getProofOrThrow(id);

    if (role !== 'admin' && proof.participant.userId !== userId) {
      throw new ForbiddenException('This payment proof is not yours');
    }

    const signed = await this.paymentService.fileUrl(proof);
    return plainToInstance(ProofFileUrlResponseDto, signed, {
      excludeExtraneousValues: true,
    });
  }

  // ==========================================================================
  // ADMIN ROUTES
  // ==========================================================================

  /**
   * The review queue, oldest first.
   */
  @Get('admin/proofs')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] List payment proofs' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentProofStatus })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Proofs list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async listProofs(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query('status') status?: string,
  ): Promise<PaymentProofListResponseDto> {
    if (status !== undefined && !(status in PaymentProofStatus)) {
      throw new BadRequestException('status must be PENDING, APPROVED or REJECTED');
    }

    const [proofs, total] = await this.paymentService.listProofs({
      status: status as PaymentProofStatus | undefined,
      skip,
      take,
    });

    return plainToInstance(
      PaymentProofListResponseDto,
      {
        data: proofs.map((proof) => this.toAdminProofResponse(proof)),
        total,
        skip,
        take,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Approve a proof and settle the participant.
   */
  @Post('admin/proofs/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Approve a payment proof' })
  @ApiParam({ name: 'id', description: 'Proof ID' })
  @ApiResponse({ status: 200, description: 'Proof approved, participant marked paid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Proof not found' })
  @ApiResponse({ status: 409, description: 'Proof was already reviewed' })
  async approveProof(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminPaymentProofResponseDto> {
    const proof = await this.paymentService.approveProof(id);
    return this.toAdminProofResponse(proof);
  }

  /**
   * Reject a proof. The participant can submit a replacement.
   */
  @Post('admin/proofs/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Reject a payment proof' })
  @ApiParam({ name: 'id', description: 'Proof ID' })
  @ApiResponse({ status: 200, description: 'Proof rejected' })
  @ApiResponse({ status: 400, description: 'Missing or too-short reason' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Proof not found' })
  @ApiResponse({ status: 409, description: 'Proof was already reviewed' })
  async rejectProof(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(RejectProofSchema)) dto: RejectProofDto,
  ): Promise<AdminPaymentProofResponseDto> {
    const proof = await this.paymentService.rejectProof(id, dto.reason);
    return this.toAdminProofResponse(proof);
  }
}
