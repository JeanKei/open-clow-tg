import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

import { SessionStore } from './session.store';
import { OpenClawHttpService } from './openclaw-http.service';
import { OpenClawUserDialogService } from './openclaw-user-dialog.service';
import { CUSTOMER_SYSTEM_PROMPT } from './prompts/customer-system.prompt';
import {
  FORBIDDEN_WORDS,
  FORBIDDEN_RESPONSE,
} from './prompts/forbidden-words.prompt';

@Injectable()
export class AiOpenclawService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiOpenclawService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly sessionStore: SessionStore,
    private readonly openClawService: OpenClawHttpService,
    private readonly dialogService: OpenClawUserDialogService,
  ) {}

  onModuleInit() {
    this.logger.log('AiOpenclawService initialized');
  }

  onModuleDestroy() {}

  createAiSession(userId: bigint) {
    const sessionId = `customer_${userId}_${randomUUID()}`;
    this.sessionStore.createSession(userId, sessionId);
    return sessionId;
  }

  private checkForbiddenWords(message: string): boolean {
    const normalized = message.toLowerCase();
    return FORBIDDEN_WORDS.some((word) => normalized.includes(word));
  }

  async sendMessage(userId: bigint, message: string): Promise<string> {
    const session = this.sessionStore.getSession(userId);
    if (!session) {
      this.logger.error(`No session found for userId=${userId}`);
      throw new Error('AI session not found');
    }

    this.logger.log(`USER ${userId} SEND - sessionId=${session.sessionId}`);

    if (this.checkForbiddenWords(message)) {
      this.logger.warn(`Forbidden words detected for userId=${userId}`);
      this.dialogService.saveMessage(userId, session.sessionId, 'user', message).catch(() => {});
      this.dialogService.saveMessage(userId, session.sessionId, 'assistant', FORBIDDEN_RESPONSE).catch(() => {});
      this.logger.log(`USER ${userId} RESPONSE (forbidden)`);
      return FORBIDDEN_RESPONSE;
    }

    this.dialogService.saveMessage(userId, session.sessionId, 'user', message).catch(() => {});

    try {
      const response = await this.openClawService.sendMessage(
        session.sessionId,
        message,
        CUSTOMER_SYSTEM_PROMPT,
      );

      this.dialogService.saveMessage(userId, session.sessionId, 'assistant', response).catch(() => {});

      this.logger.log(`USER ${userId} RESPONSE`);
      return response;
    } catch (error) {
      this.logger.error(`USER ${userId} ERROR: ${(error as Error).message}`);
      return 'Ошибка AI сервиса';
    }
  }

  stopSession(userId: bigint) {
    this.sessionStore.removeSession(userId);
  }

  hasSession(userId: bigint): boolean {
    return this.sessionStore.hasAiEnabled(userId);
  }
}
