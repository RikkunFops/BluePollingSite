import type { Character } from "./character";
import BaseStatus from "./baseStatus";

import { Aroused, Horny, Pheromones } from "./Statuses/aroused";
import { Confusion } from "./Statuses/confused";
import { Angered, Enraged } from "./Statuses/enraged";
import { Brainwashed, Corruption, Droned, Entranced, Hypnosis, Possessed, Zombie } from "./Statuses/hypno";
import { Chastity, Collared, Locked, Null } from "./Statuses/locked";
import { Poison } from "./Statuses/poison";
import { Coated, Rubber, Sealed, Suited } from "./Statuses/rubber";
import { Bound, Froze, Glued, Petrified, Pinned, Puppeted, Stuck, Webbed } from "./Statuses/stuck";

export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export type statusConstructor = new () => BaseStatus;

const hypnoRegistry = [
  Hypnosis,
  Corruption,
  Droned,
  Brainwashed,
  Zombie,
  Entranced,
  Possessed
]

const arousalRegistry = [
  Aroused,
  Horny,
  Pheromones
]

const stuckRegistry = [
  Stuck,
  Glued,
  Webbed,
  Bound,
  Pinned,
  Froze,
  Puppeted,
  Petrified
]

const rubberRegistry = [
  Rubber,
  Sealed,
  Suited,
  Coated
]

const poisonRegistry = [
  Poison
]

const enragedRegistry = [
  Enraged,
  Angered
]

const lockedRegistry = [
  Locked,
  Chastity,
  Null,
  Collared
]

const confusionRegistry = [
  Confusion
]

export const effectRegistry : Record<string, statusConstructor> = {
  Stuck,
  Glued,
  Webbed,
  Bound,
  Pinned,
  Froze,
  Puppeted,
  Petrified,

  Aroused,
  Horny,
  Pheromones,

  Rubber,
  Sealed,
  Suited,
  Coated,

  Poison,

  Enraged,
  Angered,

  Locked,
  Chastity,
  Null,
  Collared,

  Confusion,

  Hypnosis,
  Corruption,
  Droned,
  Brainwashed,
  Zombie,
  Entranced,
  Possessed,
};

export const effectRegRegistry = {
  "Hypno" : hypnoRegistry,
  "Arousal" : arousalRegistry,
  "Locked" : lockedRegistry,
  "Stuck / ASFR" : stuckRegistry,
  "Rubber" : rubberRegistry,
  "Poison" : poisonRegistry,
  "Enraged" : enragedRegistry,
  "Confusion" : confusionRegistry
}

export interface StoredStatus { 
  name: string;
  potency?: number;
}

export function CreateStatus(status: StoredStatus) : BaseStatus {
  const statusClass = effectRegistry[status.name];

  if (!statusClass) {
    throw new Error(`Unknown status: ${status.name}`);
  }

  const instance = new statusClass();

  if (instance instanceof Hypnosis) {
    instance.potency = status.potency ?? 1;
  }

  return instance;
}
