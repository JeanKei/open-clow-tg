import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiOpenclawService } from './ai-openclaw.service';
import { AiOpenclawController } from './ai-openclaw.controller';
import { SessionStore } from './session.store';
import { OpenClawHttpService } from './openclaw-http.service';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [AiOpenclawController],
  providers: [AiOpenclawService, SessionStore, OpenClawHttpService],
  exports: [AiOpenclawService, OpenClawHttpService],
})
export class AiOpenclawModule {}
