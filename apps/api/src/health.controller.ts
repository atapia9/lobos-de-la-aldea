import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', version: '0.1.0' };
  }
}
