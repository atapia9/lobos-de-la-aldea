export class CreateGameDto {
  playerNames!: string[];
  seed?: number;
  roleIds?: string[];
  difficulty?: 'EASY' | 'NORMAL' | 'HARD';
}

export class QueueActionDto {
  actorId!: string;
  targetId!: string;
  actionType!: string;
  priority!: number;
}

export class CastVoteDto {
  voterId!: string;
  targetId!: string;
}

export class EndGameDto {
  winner!: string;
}
