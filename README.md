<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## OpenClaw Telegram AI Bot

Telegram AI Bot with OpenClaw WebSocket integration supporting multiple clients.

## Features

- Telegram bot integration via `nestjs-telegraf`
- WebSocket connection to OpenClaw Gateway using `openclaw-sdk`
- Real-time communication with multiple clients via Socket.IO
- Automatic reconnection and error handling

## Project setup

```bash
$ yarn install
```

## Configuration

Create `.env` file:

```env
BOT_TOKEN=your_telegram_bot_token
OPENCLOW_API=http://your-openclow-server:18789
OPENCLOW_TOKEN=your_openclow_token
CLIENT_ID=openclaw-tg-bot
```

## Run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## WebSocket API

### Client Connection

Connect via Socket.IO to receive real-time responses:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Join a session
socket.emit('join', { userId: 123456, sessionId: 'optional-session-id' });

// Create a new session
socket.emit('createSession', { userId: 123456 });

// Send a message
socket.emit('sendMessage', { sessionId: 'session-id', message: 'Hello AI!' });

// Listen for responses
socket.on('messageReceived', (data) => {
  console.log('AI response:', data.message);
});

socket.on('sessionCreated', (data) => {
  console.log('Session created:', data.sessionId);
});

socket.on('error', (data) => {
  console.error('Error:', data);
});
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Telegram Bot  │────▶│   NestJS App    │────▶│  OpenClaw Bot   │
│   (telegraf)    │     │   (WebSocket)   │     │  (AI Service)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                      ┌─────────────────┐
                      │  Client WebSocket│
                      │    (Socket.IO)   │
                      └─────────────────┘
```

## License

MIT