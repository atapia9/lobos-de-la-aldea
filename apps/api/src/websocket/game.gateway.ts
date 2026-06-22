import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameEvent } from '@lobos/game-engine';

export interface JoinGamePayload {
  gameId: string;
  playerId: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_game')
  handleJoinGame(
    @MessageBody() payload: JoinGamePayload,
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(`game:${payload.gameId}`);
    client.emit('joined', { gameId: payload.gameId, playerId: payload.playerId });
  }

  @SubscribeMessage('leave_game')
  handleLeaveGame(
    @MessageBody() payload: { gameId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.leave(`game:${payload.gameId}`);
  }

  // Called by GameService whenever an event is emitted
  broadcastGameEvent(event: GameEvent): void {
    this.server.to(`game:${event.gameId}`).emit('game_event', {
      type: event.type,
      payload: event.payload,
      timestamp: event.timestamp,
      gameId: event.gameId,
    });
  }
}
