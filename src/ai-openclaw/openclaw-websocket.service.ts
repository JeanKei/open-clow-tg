import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OpenClawWebSocketService
  implements OnModuleInit,
    OnModuleDestroy
{
  private readonly logger = new Logger(OpenClawWebSocketService.name);
  private readonly apiUrl: string;
  private readonly token: string;
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = configService.get<string>(
      'OPENCLOW_API',
      'http://localhost:3001',
    );
    this.token = configService.get<string>('OPENCLOW_TOKEN', '');
  }

  onModuleInit() {
    this.initialized = true;
    this.logger.log('OpenClaw HTTP client initialized');
  }

  onModuleDestroy() {
    this.initialized = false;
  }

  async sendMessage(sessionId: string, message: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/v1/chat/completions`,
        {
          model: 'openclaw',
          messages: [
            { role: 'user', content: message },
          ],
          user: sessionId,
        },
        {
          timeout: 60000,
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      return (
        response.data.choices?.[0]?.message?.content ||
        'Нет ответа от AI'
      );
    } catch (error) {
      this.logger.error(
        `Failed to send message: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async createSession(userId: number): Promise<string> {
    const sessionId = `telegram_${userId}_${Date.now()}`;
    return sessionId;
  }

  getClient(): OpenClawWebSocketService | null {
    return this.initialized ? this : null;
  }

  isConnected(): boolean {
    return this.initialized;
  }
}