import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OpenClawUserDialogService {
  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(
    userId: number,
    sessionId: string,
    role: 'user' | 'assistant',
    message: string,
  ) {
    await this.prisma.openClawUserDialog.create({
      data: {
        userId,
        sessionId,
        role,
        message,
      },
    });
  }

  async getDialogHistory(sessionId: string, limit = 50) {
    return this.prisma.openClawUserDialog.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async getUserDialogs(userId: number, limit = 100) {
    return this.prisma.openClawUserDialog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}