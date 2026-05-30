import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AiOpenclawService } from './ai-openclaw/ai-openclaw.service';
import {
  FORBIDDEN_WORDS,
  FORBIDDEN_RESPONSE,
} from './ai-openclaw/prompts/forbidden-words.prompt';

interface ClientInfo {
  userId: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ClientGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ClientGateway.name);
  private clients: Map<string, ClientInfo> = new Map();

  @WebSocketServer()
  server!: Server;

  constructor(private readonly aiOpenclawService: AiOpenclawService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, payload: { userId: number }) {
    const { userId } = payload;
    this.aiOpenclawService.createAiSession(userId);
    this.clients.set(client.id, { userId });
    client.join(`user_${userId}`);
    this.logger.log(`Client ${client.id} joined user_${userId}`);
  }

  private checkForbiddenWords(message: string): boolean {
    const normalized = message.toLowerCase();
    return FORBIDDEN_WORDS.some((word) => normalized.includes(word));
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: Socket, payload: { message: string }) {
    const clientInfo = this.clients.get(client.id);
    if (!clientInfo) {
      client.emit('error', { message: 'Not joined to session' });
      return;
    }

    try {
      this.logger.log(`Message from ${client.id}: ${payload.message}`);

      if (this.checkForbiddenWords(payload.message)) {
        client.emit('messageReceived', {
          message: FORBIDDEN_RESPONSE,
          timestamp: Date.now(),
        });
        return;
      }

      const response = await this.aiOpenclawService.sendMessage(
        clientInfo.userId,
        payload.message,
      );

      client.emit('messageReceived', {
        message: response,
        timestamp: Date.now(),
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error processing message: ${err.message}`);
      client.emit('error', {
        message: 'Failed to process message',
        error: err.message,
      });
    }
  }

  getClientInfo(clientId: string) {
    return this.clients.get(clientId);
  }

  getConnectedClients(): Map<string, ClientInfo> {
    return this.clients;
  }
}
