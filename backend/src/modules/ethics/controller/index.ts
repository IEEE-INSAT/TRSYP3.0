import { Controller, Get, Put, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ZodValidationPipe } from '../../../common/pipes';
import { EthicsService, EthicsState } from '../service';
import { SetEthicsStateSchema, SetEthicsStateInput } from '../dto';

/**
 * Shared state of the live Ethical Decision Test. Reading it is open to all:
 * it says only which scenario is on screen.
 */
@ApiTags('Ethics')
@Controller('ethics')
export class EthicsController {
  constructor(private readonly ethicsService: EthicsService) {}

  /**
   * Polled every few seconds by every participant's page - and at the venue
   * they share one public IP, which the per-IP limit would quickly cut off.
   * It is a cached read, so it skips the limit.
   */
  @Get('state')
  @SkipThrottle()
  @ApiOperation({ summary: 'Which scenario is on screen and whether voting is open' })
  @ApiResponse({ status: 200, description: 'Current state' })
  getState(): Promise<EthicsState> {
    return this.ethicsService.getState();
  }

  @Put('state')
  @HttpCode(HttpStatus.OK)
  @ApiHeader({ name: 'x-moderator-key', required: true, description: 'The ETHICS_MODERATOR_KEY setting' })
  @ApiOperation({ summary: '[Moderator] Move every screen to a step and open or close voting' })
  @ApiResponse({ status: 200, description: 'Updated state' })
  @ApiResponse({ status: 403, description: 'Wrong moderator key' })
  @ApiResponse({ status: 503, description: 'No moderator key set on the server' })
  setState(
    @Headers('x-moderator-key') key: string | undefined,
    @Body(new ZodValidationPipe(SetEthicsStateSchema)) dto: SetEthicsStateInput,
  ): Promise<EthicsState> {
    return this.ethicsService.setState(key, dto);
  }

  /** Lets the control page check a key before showing its buttons. */
  @Post('moderator/check')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader({ name: 'x-moderator-key', required: true })
  @ApiOperation({ summary: '[Moderator] Check a moderator key' })
  @ApiResponse({ status: 204, description: 'Key is right' })
  @ApiResponse({ status: 403, description: 'Wrong moderator key' })
  checkKey(@Headers('x-moderator-key') key: string | undefined): void {
    this.ethicsService.assertModerator(key);
  }
}
