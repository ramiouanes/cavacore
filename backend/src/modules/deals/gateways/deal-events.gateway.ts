import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DealEvent, DealEventType } from '../interfaces/deal-events.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Deal } from '../entities/deal.entity';
import { UserEntity } from '@/modules/users/entities/user.entity';

interface SocketWithUser extends Socket {
  user?: {
    id: string;
    email: string;
  };
}

interface ConnectedClient {
  socketId: string;
  userId: string;
}

@Injectable()
@WebSocketGateway({ 
  namespace: '/deals',
  cors: {
    origin: "*",
    credentials: true
  },
  transports: ['websocket', 'polling']
})
export class DealEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server

  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  private connectedClients = new Map<string, Set<ConnectedClient>>();

  @UseGuards(JwtAuthGuard)
  async handleConnection(client: SocketWithUser) {
    const { user } = client.handshake.auth;
    if (!user?.id) {
      client.disconnect();
      return;
    }
    client.user = user;
    
    const userDeals = await this.getUserDeals(user.id);
    userDeals.forEach(dealId => {
      client.join(`deal:${dealId}`);
      this.addClientToDeal(dealId, client.id, user.id);
    });
  
    this.broadcastPresence(user.id);
  }

  handleDisconnect(client: SocketWithUser) {
    const { user } = client.handshake.auth;
    if (!user?.id) {
      client.disconnect();
      return;
    }

    this.connectedClients.forEach((clients, dealId) => {
      if (clients.has(user.id)) {
        clients.delete(user.id);
        if (client.user?.id) {
            this.broadcastPresence(client.user.id);
          }
      }
    });
  }

  @SubscribeMessage('subscribeToDeal')
  handleDealSubscription(client: SocketWithUser, dealId: string) {
    const { user } = client.handshake.auth;
    client.join(`deal:${dealId}`);
    this.addClientToDeal(dealId, client.id, user.id);
    if (client.user?.id) {
      this.broadcastPresence(client.user.id);
    }
  }

  @SubscribeMessage('unsubscribeFromDeal') 
  handleDealUnsubscription(client: SocketWithUser, dealId: string) {
    const { user } = client.handshake.auth;
    client.leave(`deal:${dealId}`);
    this.removeClientFromDeal(dealId, client.id, user.id);
    if (client.user?.id) {
      this.broadcastPresence(client.user.id);
    }
  }

  private addClientToDeal(dealId: string, socketId: string, userId: string) {
    if (!this.connectedClients.has(dealId)) {
      this.connectedClients.set(dealId, new Set());
    }
    this.connectedClients.get(dealId)?.add({ socketId, userId });
  }
  

  private removeClientFromDeal(dealId: string, socketId: string, userId: string) {
    if (!this.connectedClients.has(dealId)) {
      this.connectedClients.set(dealId, new Set());
    }
    this.connectedClients.get(dealId)?.delete({ socketId, userId });
  }

  private async broadcastPresence(userId: string) {
    for (const [dealId, clients] of this.connectedClients.entries()) {
      const userIds = Array.from(clients).map(client => client.userId);
      const users = await this.userRepository.find({
        where: { id: In(userIds) },
        select: ['id', 'email', 'firstName', 'lastName']
      });
      
      this.server.to(`deal:${dealId}`).emit('presence', {
        dealId,
        connectedUsers: users
      });
    }
  }
  

  emitDealEvent(event: DealEvent) {
    const room = `deal:${event.dealId}`;
    this.server.to(room).emit(`deal.${event.type}`, event);
  }

  private async getUserDeals(userId: string): Promise<string[]> {
    const deals = await this.dealRepository
      .createQueryBuilder('deal')
      .select('deal.id')
      .where(`deal.participants @> :participant`, { 
        participant: JSON.stringify([{ userId }]) 
      })
      .orWhere('deal.createdById = :userId', { userId })
      .getMany();
    
    return deals.map(deal => deal.id);
  }
}