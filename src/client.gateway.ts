import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OpenClawHttpService } from './ai-openclaw/openclaw-http.service';

interface ClientInfo {
  userId: number;
  sessionId?: string;
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

  constructor(
    private readonly openClawService: OpenClawHttpService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, payload: { userId: number; sessionId?: string }) {
    const { userId, sessionId } = payload;
    this.clients.set(client.id, { userId, sessionId });
    client.join(`user_${userId}`);
    this.logger.log(`Client ${client.id} joined user_${userId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: Socket,
    payload: { message: string; sessionId: string },
  ) {
    const clientInfo = this.clients.get(client.id);
    if (!clientInfo) {
      client.emit('error', { message: 'Not joined to session' });
      return;
    }

    try {
      this.logger.log(`Message from ${client.id}: ${payload.message}`);

      const response = await this.openClawService.sendMessage(
        clientInfo.sessionId!,
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

  @SubscribeMessage('createSession')
  async handleCreateSession(client: Socket, payload: { userId: number }) {
    try {
      const sessionId = await this.openClawService.createSession(
        payload.userId,
      );
      client.emit('sessionCreated', { sessionId, userId: payload.userId });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error creating session: ${err.message}`);
      client.emit('error', {
        message: 'Failed to create session',
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
