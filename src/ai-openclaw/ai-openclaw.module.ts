import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiOpenclawService } from './ai-openclaw.service';
import { AiOpenclawController } from './ai-openclaw.controller';
import { SessionStore } from './session.store';
import { OpenClawHttpService } from './openclaw-http.service';
import { OpenClawUserDialogService } from './openclaw-user-dialog.service';
import { PrismaService } from '../prisma/prisma.service';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [AiOpenclawController],
  providers: [
    AiOpenclawService,
    SessionStore,
    OpenClawHttpService,
    OpenClawUserDialogService,
    PrismaService,
  ],
  exports: [AiOpenclawService, OpenClawHttpService, OpenClawUserDialogService],
})
export class AiOpenclawModule {}
