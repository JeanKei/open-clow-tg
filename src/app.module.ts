import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';

import { TelegramModule } from './telegram/telegram.module';
import { AiOpenclawModule } from './ai-openclaw/ai-openclaw.module';
import { ClientGateway } from './client.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.get<string>('BOT_TOKEN')!,
      }),
    }),

    TelegramModule,
    AiOpenclawModule,
  ],
  controllers: [],
  providers: [ClientGateway],
})
export class AppModule {}
