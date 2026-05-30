# Open-Clow Telegram Bot

AI-бот для MolecularMeal с интеграцией OpenClaw.

## Архитектура

```
Telegram → NestJS → OpenClaw API → AI Response
           ↓
       PostgreSQL (dialog history)
```

### Компоненты

- **TelegramModule** - обработка Telegram updates через Telegraf (polling)
- **AiOpenclawModule** - интеграция с OpenClaw API, управление сессиями
- **PrismaService** - PostgreSQL через Prisma ORM
- **ClientGateway** - WebSocket для веб-клиентов

### Многопоточность

Обработка сообщений **неблокирующая**:
- `onMessage()` завершается мгновенно
- `processMessageAsync()` работает в фоне
- Множество пользователей обрабатываются параллельно

### Потоки данных

1. **Пользователь → Bot**
   - Telegram update → `TelegramUpdate.onMessage()`
   - Проверка сессии → `SessionStore`
   - Async обработка → `AiOpenclawService.sendMessage()`

2. **Bot → OpenClaw**
   - HTTP request с system prompt + user message
   - Keep-Alive connection pool (100 concurrent)
   - Retry: 3 попытки при socket hang up

3. **Dialog History**
   - Save user message → PostgreSQL (async, non-blocking)
   - Save AI response → PostgreSQL (async, non-blocking)

## Сессии

- Format: `customer_{userId}_{UUID}`
- Storage: in-memory `Map<userId, Session>`
- BigInt для Telegram userId (>2^31)

## Безопасность

- **System Prompt** - ограничение ответов только про MolecularMeal
- **Forbidden Words Filter** - блокировка попыток получить системную информацию
- HTML sanitization - замена `<br>` на `\n` для Telegram

## Environment

```env
BOT_TOKEN=your_telegram_token
OPENCLOW_API=http://your-openclow-server:port
OPENCLOW_TOKEN=your_token
DATABASE_URL="postgresql://user:pass@host:port/db"
```

## Запуск

```bash
yarn install
npx prisma generate
npx prisma migrate dev
yarn start:dev
```