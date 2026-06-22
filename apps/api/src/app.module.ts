import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { WebsocketModule } from './websocket/websocket.module';
import { HealthController } from './health.controller';

@Module({
  imports: [WebsocketModule, GameModule],
  controllers: [HealthController],
})
export class AppModule {}
