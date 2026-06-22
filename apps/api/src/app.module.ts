import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module.js';
import { WebsocketModule } from './websocket/websocket.module.js';

@Module({
  imports: [WebsocketModule, GameModule],
})
export class AppModule {}
