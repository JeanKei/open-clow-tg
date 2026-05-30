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

  createAiSession(userId: number) {
    const sessionId = `customer_${userId}_${randomUUID()}`;
    this.sessionStore.createSession(userId, sessionId);
    return sessionId;
  }

  private checkForbiddenWords(message: string): boolean {
    const normalized = message.toLowerCase();
    return FORBIDDEN_WORDS.some((word) => normalized.includes(word));
  }

  async sendMessage(userId: number, message: string): Promise<string> {
    const session = this.sessionStore.getSession(userId);
    if (!session) {
      throw new Error('AI session not found');
    }

    if (this.checkForbiddenWords(message)) {
      await this.dialogService.saveMessage(
        userId,
        session.sessionId,
        'user',
        message,
      );
      await this.dialogService.saveMessage(
        userId,
        session.sessionId,
        'assistant',
        FORBIDDEN_RESPONSE,
      );
      return FORBIDDEN_RESPONSE;
    }

    await this.dialogService.saveMessage(
      userId,
      session.sessionId,
      'user',
      message,
    );

    try {
      const response = await this.openClawService.sendMessage(
        session.sessionId,
        message,
        CUSTOMER_SYSTEM_PROMPT,
      );

      await this.dialogService.saveMessage(
        userId,
        session.sessionId,
        'assistant',
        response,
      );

      return response;
    } catch (error) {
      this.logger.error((error as Error).message);
      return 'Ошибка AI сервиса';
    }
  }

  stopSession(userId: number) {
    this.sessionStore.removeSession(userId);
  }

  hasSession(userId: number): boolean {
    return this.sessionStore.hasAiEnabled(userId);
  }
}
