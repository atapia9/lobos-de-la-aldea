import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway.js';

@Module({
  providers: [GameGateway],
  exports: [GameGateway],
})
export class WebsocketModule {}
