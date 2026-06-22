import { Module } from '@nestjs/common';
import { GameController } from './game.controller.js';
import { GameService } from './game.service.js';
import { WebsocketModule } from '../websocket/websocket.module.js';

@Module({
  imports: [WebsocketModule],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
