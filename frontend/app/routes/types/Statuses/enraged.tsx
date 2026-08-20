import type { Character } from "../character";
import { getRandomInt } from "../status";
import BaseStatus, {StatusType} from "../baseStatus";

export class Enraged extends BaseStatus {
    constructor() {
        super(
            "Enraged",
            "Enraged",
            StatusType.Debuff,
            0,
            0,
            false,
            1,
            1
        );
    }   

    getProcMessage(actor: Character): string {
        return actor.name + " attacks so aggresively they hurt themself!"
    }

    doApply(actor: Character): Character {
        const finChar = actor;
        if (!finChar.statuses[this.name] && getRandomInt(1,100) <= 33) {
            finChar.statuses[this.name] = this
        }
        return finChar
    }

    doProc(actor: Character): Character {
        const finChar = actor;
            if (getRandomInt(1,100) <= 50) {
                
            }
        return finChar
    }
}

export class Angered extends Enraged {
    name = "Angered";
}