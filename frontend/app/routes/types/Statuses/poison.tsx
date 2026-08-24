import type { Character } from "../character";
import { getRandomInt } from "../status";
import BaseStatus, {StatusType} from "../baseStatus";

export class Poison extends BaseStatus {
    constructor() {
        super(
            "Poison",
            "Poison",
            StatusType.Burn,
            0,
            0,
            false,
            1,
            1
        );
    }

    getProcMessage(actor: Character): string {
        return actor.name + " is poisoned!"
    }

    doApply(actor: Character): Character {
        const finChar = actor;
        if (!finChar.statuses[this.baseName] && getRandomInt(1,100) <= 33) {
            const status = new (this.constructor as new () => typeof this)();
            finChar.statuses[this.baseName] = status;
        }
        return finChar
    }

    doProc(actor: Character): Character {
        const finChar = actor;
        return finChar;
    }
}