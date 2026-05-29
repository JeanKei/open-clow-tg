import { Injectable } from '@nestjs/common';

export interface AiSession {
  userId: number;
  sessionId: string;
  aiEnabled: boolean;
  createdAt: Date;
}

@Injectable()
export class SessionStore {
  private readonly sessions = new Map<number, AiSession>();

  createSession(userId: number, sessionId: string) {
    this.sessions.set(userId, {
      userId,
      sessionId,
      aiEnabled: true,
      createdAt: new Date(),
    });
  }

  getSession(userId: number) {
    return this.sessions.get(userId);
  }

  removeSession(userId: number) {
    this.sessions.delete(userId);
  }

  hasAiEnabled(userId: number): boolean {
    return this.sessions.has(userId);
  }
}
