import {
  Controller, Get, Post, Body, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { GameService } from './game.service.js';
import { CreateGameDto, QueueActionDto, CastVoteDto, EndGameDto } from './game.dto.js';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createGame(@Body() dto: CreateGameDto) {
    return this.gameService.createGame(dto);
  }

  @Get()
  listGames() {
    return this.gameService.listGames();
  }

  @Get(':id')
  getGame(@Param('id') id: string) {
    return this.gameService.getGame(id);
  }

  @Post(':id/night/start')
  @HttpCode(HttpStatus.OK)
  startNight(@Param('id') id: string) {
    return this.gameService.startNight(id);
  }

  @Post(':id/night/actions')
  @HttpCode(HttpStatus.NO_CONTENT)
  queueAction(@Param('id') id: string, @Body() dto: QueueActionDto) {
    this.gameService.queueAction(id, dto);
  }

  @Post(':id/night/resolve')
  @HttpCode(HttpStatus.OK)
  resolveNight(@Param('id') id: string) {
    return this.gameService.resolveNight(id);
  }

  @Post(':id/day/start')
  @HttpCode(HttpStatus.OK)
  startDay(@Param('id') id: string) {
    return this.gameService.startDay(id);
  }

  @Post(':id/voting/start')
  @HttpCode(HttpStatus.OK)
  startVoting(@Param('id') id: string) {
    return this.gameService.startVoting(id);
  }

  @Post(':id/votes')
  @HttpCode(HttpStatus.OK)
  castVote(@Param('id') id: string, @Body() dto: CastVoteDto) {
    return this.gameService.castVote(id, dto);
  }

  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  executePlayer(@Param('id') id: string) {
    return this.gameService.executePlayer(id);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  endGame(@Param('id') id: string, @Body() dto: EndGameDto) {
    return this.gameService.endGame(id, dto.winner);
  }
}
