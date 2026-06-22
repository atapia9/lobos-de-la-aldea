import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [WebsocketModule, GameModule],
})
export class AppModule {}
