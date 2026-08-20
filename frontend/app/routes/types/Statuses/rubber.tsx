import type { Character } from "../character";
import { getRandomInt } from "../status";
import BaseStatus, {StatusType} from "../baseStatus";

export class Rubber extends BaseStatus {
    constructor() {
        super(
            "Rubber",
            "Rubber",
            StatusType.Debuff,
            0,
            15,
            true,
            3,
            0
        );
    }

    getProcMessage(actor: Character): string {
        return actor.name + " is bound in rubber!"
    }

    doApply(actor: Character): Character {
        const finChar: Character = actor;
        if (finChar.statuses[this.baseName]) {
            if (finChar.statuses[this.baseName].stacks < this.maxStacks && getRandomInt(1,100) <= 50) {
                finChar.statuses[this.baseName].stacks++;
            }
        }
        else {
            if (getRandomInt(1,100) <= 50) {
                this.stacks = 1
                finChar.statuses[this.baseName] = this
            }
        }
        return finChar
    }

    doProc(actor: Character): Character {
        const finChar = actor;
        finChar.style -= this.stacks;
        finChar.special -= this.stacks;
        return finChar;
    }
}

export class Sealed extends Rubber {
    name = "Sealed";
}

export class Suited extends Rubber {
    name = "Suited";

}

export class Coated extends Rubber {
    name = "Coated";
}