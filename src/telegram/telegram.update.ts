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
        [Markup.button.callback('Спросить Шефа', 'START_AI_CHAT')],
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
      '👨‍🍳 Задайте свой вопрос ИИ Шефу, и я постараюсь ответить максимально полезно!',
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
        'чат c ИИ Шефом не активен. Нажмите "Спросить Шефа" чтобы начать.',
      );
      return;
    }

    await ctx.sendChatAction('typing');

    let typingInterval = setInterval(() => {
      ctx.sendChatAction('typing').catch(() => {});
    }, 4000);

    try {
      const response = await this.aiOpenclawService.sendMessage(userId, text!);
      clearInterval(typingInterval);
      await ctx.reply(response, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ Завершить диалог', 'STOP_AI_CHAT')],
        ]),
      });
    } catch {
      clearInterval(typingInterval);
      await ctx.reply(
        'Ошибка отправки сообщения. Попробуйте /stopai и снова начать чат.',
      );
    }
  }
}
