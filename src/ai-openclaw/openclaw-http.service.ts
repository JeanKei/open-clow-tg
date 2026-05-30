import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import http from 'http';

@Injectable()
export class OpenClawHttpService
  implements OnModuleInit,
    OnModuleDestroy
{
  private readonly logger = new Logger(OpenClawHttpService.name);
  private readonly apiUrl: string;
  private readonly token: string;
  private initialized = false;
  private httpClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = configService.get<string>(
      'OPENCLOW_API',
      'http://localhost:3001',
    );
    this.token = configService.get<string>('OPENCLOW_TOKEN', '');

    const httpAgent = new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      maxFreeSockets: 10,
      timeout: 300000,
    });

    this.httpClient = axios.create({
      httpAgent,
      timeout: 300000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
  }

  onModuleInit() {
    this.initialized = true;
    this.logger.log('OpenClaw HTTP client initialized with Keep-Alive');
  }

  onModuleDestroy() {
    this.initialized = false;
  }

  async sendMessage(
    sessionId: string,
    message: string,
    systemPrompt: string,
    retries = 3,
  ): Promise<string> {
    const startTime = Date.now();
    this.logger.log(`[${sessionId}] START`);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.httpClient.post(
          `${this.apiUrl}/v1/chat/completions`,
          {
            model: 'openclaw',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            user: sessionId,
          },
        );

        const duration = Date.now() - startTime;
        this.logger.log(`[${sessionId}] END - ${duration}ms`);

        return response.data.choices?.[0]?.message?.content || 'Нет ответа от AI';
      } catch (error) {
        const duration = Date.now() - startTime;
        const err = error as Error;
        
        if (attempt < retries && (err.message.includes('socket hang up') || err.message.includes('timeout'))) {
          this.logger.warn(`[${sessionId}] RETRY ${attempt}/${retries} after ${duration}ms: ${err.message}`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        
        this.logger.error(`[${sessionId}] FAILED after ${duration}ms: ${err.message}`);
        throw error;
      }
    }

    throw new Error('Max retries exceeded');
  }

  async createSession(userId: number): Promise<string> {
    const sessionId = `customer_${userId}_${Date.now()}`;
    return sessionId;
  }

  getClient(): OpenClawHttpService | null {
    return this.initialized ? this : null;
  }

  isConnected(): boolean {
    return this.initialized;
  }
}
