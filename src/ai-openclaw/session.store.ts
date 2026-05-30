import { Injectable, Logger } from '@nestjs/common';

export interface AiSession {
  userId: bigint;
  sessionId: string;
  aiEnabled: boolean;
  createdAt: Date;
}

@Injectable()
export class SessionStore {
  private readonly logger = new Logger(SessionStore.name);
  private readonly sessions = new Map<bigint, AiSession>();

  createSession(userId: bigint, sessionId: string) {
    this.sessions.set(userId, {
      userId,
      sessionId,
      aiEnabled: true,
      createdAt: new Date(),
    });
    this.logger.log(`Session created for userId=${userId}, sessionId=${sessionId}`);
  }

  getSession(userId: bigint) {
    const session = this.sessions.get(userId);
    this.logger.log(`Get session for userId=${userId}, found=${!!session}`);
    return session;
  }

  removeSession(userId: bigint) {
    this.sessions.delete(userId);
    this.logger.log(`Session removed for userId=${userId}`);
  }

  hasAiEnabled(userId: bigint): boolean {
    const has = this.sessions.has(userId);
    this.logger.log(`Has session for userId=${userId}, has=${has}`);
    return has;
  }

  getAllSessions() {
    return Array.from(this.sessions.entries()).map(([userId, session]) => ({
      userId,
      sessionId: session.sessionId,
    }));
  }
}
