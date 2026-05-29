import { Controller, Get } from '@nestjs/common';

@Controller('ai-openclaw')
export class AiOpenclawController {
  @Get('health')
  health() {
    return {
      ok: true,
    };
  }
}
