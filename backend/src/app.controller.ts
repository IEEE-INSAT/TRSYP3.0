import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }

  // TEMP debug endpoint for verifying `trust proxy` — returns the IP the server
  // resolved for this request, plus the raw X-Forwarded-For chain. Remove once
  // the rate-limit setup is confirmed.
  @Get('debug/ip')
  getDebugIp(@Req() req: Request) {
    return {
      ip: req.ip,
      xff: req.headers['x-forwarded-for'] ?? null,
    };
  }
}
