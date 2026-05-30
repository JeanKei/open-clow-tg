import { Action, Ctx, Hears, Start, Update, On } from 'nestjs-telegraf';

import { Context, Markup } from 'telegraf';

import { AiOpenclawService } from '../ai-openclaw/ai-openclaw.service';

@Update()
export class TelegramUpdate {
  constructor(private readonly aiOpenclawService: AiOpenclawService) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    await ctx.reply(
      'Добро пожаловать в AI бота',
      Markup.inlineKeyboard([
        [Markup.button.callback('🤖 Написать AI Боту', 'START_AI_CHAT')],
      ]),
    );
  }

  @Action('START_AI_CHAT')
  async startAiChat(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const userId = ctx.from?.id;
    if (!userId) {
      return;
    }

    this.aiOpenclawService.createAiSession(userId);

    await ctx.reply(
      '👨‍🍳 Задайте свой вопрос повару, и я постараюсь ответить максимально полезно!',
      Markup.inlineKeyboard([
        [Markup.button.callback('❌ Завершить диалог', 'STOP_AI_CHAT')],
      ]),
    );
  }

  @Action('STOP_AI_CHAT')
  async stopAiChat(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const userId = ctx.from?.id;
    if (!userId) {
      return;
    }

    this.aiOpenclawService.stopSession(userId);

    await ctx.reply('👨‍🍳 Рад был помочь! Обращайтесь ещё 😊');
  }

  @Hears('/stopai')
  async stopAi(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) {
      return;
    }

    this.aiOpenclawService.stopSession(userId);

    await ctx.reply('👨‍🍳 Рад был помочь! Обращайтесь ещё 😊');
  }

  @On('text')
  async onMessage(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    const text =
      'text' in (ctx.message || {})
        ? (ctx.message as { text: string }).text
        : undefined;

    if (!userId || text === '/start' || text === '/stopai') {
      return;
    }

    const hasSession = this.aiOpenclawService.hasSession(userId);

    if (!hasSession) {
      await ctx.reply(
        'AI чат не активен. Нажмите "Написать AI Боту" чтобы начать.',
      );
      return;
    }

    await ctx.sendChatAction('typing');

    try {
      const response = await this.aiOpenclawService.sendMessage(userId, text!);
      await ctx.reply(
        response,
        Markup.inlineKeyboard([
          [Markup.button.callback('❌ Завершить диалог', 'STOP_AI_CHAT')],
        ]),
      );
    } catch {
      await ctx.reply(
        'Ошибка отправки сообщения. Попробуйте /stopai и снова начать чат.',
      );
    }
  }
}