import { Module } from '@nestjs/common';

import { TelegramUpdate } from './telegram.update';
import { AiOpenclawModule } from '../ai-openclaw/ai-openclaw.module';

@Module({
  imports: [AiOpenclawModule],
  providers: [TelegramUpdate],
})
export class TelegramModule {}
