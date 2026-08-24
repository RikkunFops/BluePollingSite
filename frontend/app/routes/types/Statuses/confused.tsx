import type { Character } from "../character";
import { getRandomInt } from "../status";
import BaseStatus, {StatusType} from "../baseStatus";
export class Confusion extends BaseStatus {
    constructor() {
        super(
            "Confusion",
            "Confusion",
            StatusType.Debuff,
            1,
            1,
            false,
            1,
            1
        );
    }
    getProcMessage(actor: Character): string {
        return actor.name + " is struggling to focus..."
    }

    doApply(actor: Character): Character {
        const finChar = actor;
        if (!finChar.statuses[this.baseName] && getRandomInt(1,100) <= 33) {
            const status = new (this.constructor as new () => typeof this)();
            finChar.statuses[this.baseName] = status;
        }
        return finChar;
    }

    doProc(actor: Character): Character {
        const finChar = actor;
        if (getRandomInt(1,4) == 4) {
            finChar.attack -=3;
            finChar.style -= 3;
        }
        delete finChar.statuses[this.baseName];
        return finChar;
    }
}