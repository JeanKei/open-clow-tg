import { Action, Ctx, Hears, Start, Update, On } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';

import { Context, Markup } from 'telegraf';

import { AiOpenclawService } from '../ai-openclaw/ai-openclaw.service';
import { sanitizeHtmlForTelegram } from '../utils/html-sanitizer.util';

@Update()
export class TelegramUpdate {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(private readonly aiOpenclawService: AiOpenclawService) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    await ctx.reply(
      'Добро пожаловать в AI бота',
      Markup.inlineKeyboard([
        [Markup.button.callback('Спросить Шефа', 'START_AI_CHAT')],
      ]),
    );
  }

  @Action('START_AI_CHAT')
  async startAiChat(@Ctx() ctx: Context) {
    try {
      await ctx.answerCbQuery();
    } catch {
      // ignore timeout errors
    }

    const userId = ctx.from?.id;
    const username = ctx.from?.username || 'unknown';
    if (!userId) {
      return;
    }

    this.logger.log(`Starting AI chat for userId=${userId} (@${username})`);

    this.aiOpenclawService.createAiSession(BigInt(userId));

    await ctx.reply(
      '👨‍🍳 Задайте свой вопрос ИИ Шефу, и я постараюсь ответить максимально полезно!',
      Markup.inlineKeyboard([
        [Markup.button.callback('❌ Завершить диалог', 'STOP_AI_CHAT')],
      ]),
    );
  }

  @Action('STOP_AI_CHAT')
  async stopAiChat(@Ctx() ctx: Context) {
    try {
      await ctx.answerCbQuery();
    } catch {
      // ignore timeout errors
    }

    const userId = ctx.from?.id;
    if (!userId) {
      return;
    }

    this.aiOpenclawService.stopSession(BigInt(userId));

    await ctx.reply('👨‍🍳 Рад был помочь! Обращайтесь ещё 😊');
  }

  @Hears('/stopai')
  async stopAi(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) {
      return;
    }

    this.aiOpenclawService.stopSession(BigInt(userId));

    await ctx.reply('👨‍🍳 Рад был помочь! Обращайтесь ещё 😊');
  }

  @On('text')
  async onMessage(@Ctx() ctx: Context) {
    const rawTimestamp = Date.now();
    const userId = ctx.from?.id;
    const username = ctx.from?.username || 'unknown';
    const text =
      'text' in (ctx.message || {})
        ? (ctx.message as { text: string }).text
        : undefined;

    this.logger.log(`RAW UPDATE userId=${userId} (@${username}) ts=${rawTimestamp}`);

    if (!userId || text === '/start' || text === '/stopai') {
      return;
    }

    const hasSession = this.aiOpenclawService.hasSession(BigInt(userId));

    this.logger.log(`hasSession for userId=${userId}: ${hasSession}`);

    if (!hasSession) {
      await ctx.reply(
        'чат c ИИ Шефом не активен. Нажмите "Спросить Шефа" чтобы начать.',
      );
      return;
    }

    this.logger.log(`BEFORE AI userId=${userId}`);

    await ctx.sendChatAction('typing');

    // Process in background - don't await!
    this.processMessageAsync(ctx, BigInt(userId), text!);
  }

  private async processMessageAsync(ctx: Context, userId: bigint, text: string) {
    let typingInterval = setInterval(() => {
      ctx.sendChatAction('typing').catch(() => {});
    }, 4000);

    try {
      this.logger.log(`Sending message to AI for userId=${userId}`);
      const response = await this.aiOpenclawService.sendMessage(userId, text);
      this.logger.log(`Got response for userId=${userId}: ${response.substring(0, 50)}...`);
      clearInterval(typingInterval);
      await ctx.reply(sanitizeHtmlForTelegram(response), {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ Завершить диалог', 'STOP_AI_CHAT')],
        ]),
      });
    } catch (error) {
      this.logger.error(`Error for userId=${userId}: ${(error as Error).message}`);
      clearInterval(typingInterval);
      await ctx.reply(
        'Ошибка отправки сообщения. Попробуйте /stopai и снова начать чат.',
      );
    }
  }
}
