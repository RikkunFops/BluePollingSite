import type { Character } from "../character";
import { getRandomInt } from "../status";
import BaseStatus, {StatusType} from "../baseStatus";

export class Locked extends BaseStatus {
    constructor() {
        super(
            "Locked",
            "Locked",
            StatusType.Debuff,
            1,
            1,
            false,
            1,
            1
        );
    }

    getProcMessage(actor: Character): string {
        return actor.name + " is locked, and is slower!"
    }

    doApply(actor: Character): Character {
        const finChar = actor
        if (!finChar.statuses[this.baseName] && getRandomInt(1,100) <= 25) {
            finChar.statuses[this.baseName] = this;
        }
        return finChar
    }
    doProc(actor: Character): Character {
        return actor;
    }
}
export class Chastity extends Locked {
    name = "Chastity";
}

export class Null extends Locked {
    name = "Null";
}

export class Collared extends Locked {
    name = "Collared";
}