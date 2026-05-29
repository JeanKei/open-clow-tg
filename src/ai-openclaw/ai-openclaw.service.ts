import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

import { SessionStore } from './session.store';
import { OpenClawWebSocketService } from './openclaw-websocket.service';

@Injectable()
export class AiOpenclawService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiOpenclawService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly sessionStore: SessionStore,
    private readonly openClawService: OpenClawWebSocketService,
  ) {}

  onModuleInit() {
    this.logger.log('AiOpenclawService initialized');
  }

  onModuleDestroy() {}

  createAiSession(userId: number) {
    const sessionId = `telegram_${userId}_${randomUUID()}`;
    this.sessionStore.createSession(userId, sessionId);
    return sessionId;
  }

  async sendMessage(userId: number, message: string): Promise<string> {
    const session = this.sessionStore.getSession(userId);
    if (!session) {
      throw new Error('AI session not found');
    }

    try {
      const response = await this.openClawService.sendMessage(
        session.sessionId,
        message,
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
