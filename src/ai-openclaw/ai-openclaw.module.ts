import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiOpenclawService } from './ai-openclaw.service';
import { AiOpenclawController } from './ai-openclaw.controller';
import { SessionStore } from './session.store';
import { OpenClawWebSocketService } from './openclaw-websocket.service';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [AiOpenclawController],
  providers: [AiOpenclawService, SessionStore, OpenClawWebSocketService],
  exports: [AiOpenclawService, OpenClawWebSocketService],
})
export class AiOpenclawModule {}
