import type { Character } from "./character";

export enum StatusType {
    Debuff = 0,
    Burn = 1,
    Buff = 2
}

interface Status {
    name: string;
    type: StatusType

    value: number;
    maxValue: number;

    stacking: boolean;
    maxStacks: number;
    stacks: number;

}

export default abstract class BaseStatus implements Status {
  constructor(
    public name: string,
    public baseName: string,
    public type: StatusType,

    public value: number,
    public maxValue: number,

    public stacking: boolean,
    public maxStacks: number,
    public stacks: number,

  ) {}

  abstract getProcMessage(actor: Character) : string;

  abstract doApply(actor: Character) : Character;

  abstract doProc(actor: Character): Character;
}