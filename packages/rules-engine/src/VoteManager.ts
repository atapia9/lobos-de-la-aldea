import { Player } from '@lobos/game-engine';

export interface VoteTally {
  counts: Map<string, number>;
  leader: string | null;
  isTie: boolean;
  totalVotes: number;
}

export interface VoteRecord {
  voterId: string;
  targetId: string;
  round: number;
}

export type VoteRoundResult =
  | { outcome: 'EXECUTION'; targetId: string }
  | { outcome: 'TIE_REVOTE'; candidates: string[] }
  | { outcome: 'NO_EXECUTION' };

export class VoteManager {
  private records: VoteRecord[] = [];
  private round = 1;

  get currentRound(): number {
    return this.round;
  }

  castVote(voterId: string, targetId: string, alivePlayers: Player[]): void {
    const voter = alivePlayers.find((p) => p.id === voterId && p.alive);
    if (!voter) throw new Error(`Player ${voterId} cannot vote: not alive or not found`);
    if (!alivePlayers.find((p) => p.id === targetId && p.alive)) {
      throw new Error(`Target ${targetId} is not a valid alive player`);
    }
    // One vote per voter per round — overwrite if they change their vote
    this.records = this.records.filter((r) => !(r.voterId === voterId && r.round === this.round));
    this.records.push({ voterId, targetId, round: this.round });
  }

  tally(candidateIds?: string[]): VoteTally {
    const roundRecords = this.records.filter((r) => r.round === this.round);
    const counts = new Map<string, number>();

    for (const record of roundRecords) {
      if (candidateIds && !candidateIds.includes(record.targetId)) continue;
      counts.set(record.targetId, (counts.get(record.targetId) ?? 0) + 1);
    }

    let maxVotes = 0;
    let leader: string | null = null;
    let tie = false;

    for (const [id, count] of counts) {
      if (count > maxVotes) {
        maxVotes = count;
        leader = id;
        tie = false;
      } else if (count === maxVotes) {
        tie = true;
      }
    }

    return {
      counts,
      leader: tie ? null : leader,
      isTie: tie,
      totalVotes: roundRecords.length,
    };
  }

  resolveRound(alivePlayers: Player[], candidateIds?: string[]): VoteRoundResult {
    const { leader, isTie, counts } = this.tally(candidateIds);

    if (!isTie && leader) {
      return { outcome: 'EXECUTION', targetId: leader };
    }

    if (isTie && this.round === 1) {
      // First tie: re-vote among tied candidates
      const tied = [...counts.entries()]
        .filter(([, c]) => c === Math.max(...counts.values()))
        .map(([id]) => id);
      this.round = 2;
      this.records = this.records.filter((r) => r.round !== 2);
      return { outcome: 'TIE_REVOTE', candidates: tied };
    }

    // Second tie or no votes: no execution
    return { outcome: 'NO_EXECUTION' };
  }

  reset(): void {
    this.records = [];
    this.round = 1;
  }

  getRecords(): readonly VoteRecord[] {
    return this.records;
  }
}
