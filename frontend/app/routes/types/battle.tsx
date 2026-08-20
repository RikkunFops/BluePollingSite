import { type Character } from "./character";
import BaseStatus from "./baseStatus";
export enum Action {
    Attack = 0,
    Counter = 1,
    Status = 2
}

export interface Actor {
    character: Character;
    health: number;
}

export interface Turn {
    actor: Actor;
    action: Action;
    success: boolean;
    attack: number;
    defense: number;
    damage: number;
    turnMessage: string;
}

export interface Round {
    round_no?: number;
    roundNo?: number;
    First: Actor;
    Second: Actor;
    turns: Turn[]
}

export interface Battle {
    winner: Actor;
    loser: Actor;
    starting_health?: number;
    startingHealth?: number;
    available_at?: string;
    rounds: Round[]; 
}

export interface BattleResponse {
    success: boolean
    count: number
    data: Battle[]
}

export interface BattleRecord {
  id: number;
  winner: string;
  loser: string;
  available_at: string;
  battle_json_url: string;
  created_at: string;
  battle: BattleApi;
}

export interface BattleApi {
  winner: Actor;
  loser: Actor;
  startingHealth: number;
  rounds: RoundApi[];
}

export interface RoundApi {
  roundNo: number;
  First: Actor;
  Second: Actor;
  turns: Turn[];
}