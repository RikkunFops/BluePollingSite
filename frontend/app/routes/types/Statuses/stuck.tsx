import type { Character } from "../character";
import { getRandomInt } from "../status";
import BaseStatus, {StatusType} from "../baseStatus";

export class Stuck extends BaseStatus {
    constructor() {
        super(
            "Stuck",
            "Stuck",
            StatusType.Debuff,
            0,
            15,
            true,
            4,
            0
        );
    }

    getProcMessage(actor: Character): string {
        if (this.stacks <= 3)
            return actor.name + " is stuck! It's really getting hard to move."
        else 
            return actor.name + " can't move! They're stuck in place."
    }

    doApply(actor: Character): Character {
        const finChar: Character = actor;
        if (finChar.statuses[this.name]) {
            if (finChar.statuses[this.name].stacks < this.maxStacks && getRandomInt(1,100) <= 33) {
                finChar.statuses[this.name].stacks++;
            }
        }
        else {
            if (getRandomInt(1,100) <= 33) {
                this.stacks = 1
                finChar.statuses[this.name] = this
            }
        }
        return finChar
    }

    doProc(actor: Character): Character {
        const finChar = actor 
        if (this.stacks <= 3) {
            finChar.speed -= this.stacks;
            finChar.attack -= this.stacks;
            finChar.defense -= this.stacks;
        }
        else if (this.stacks >= 4) {
            const rng = getRandomInt(1,2)
            if (rng == 2) {
                delete finChar.statuses[this.name];
            }
            else {
                finChar.stuck = true;
            }
        }
        return finChar;
    }
}

export class Glued extends Stuck {
    name = "Glued";
    
}

export class Webbed extends Stuck {
    name = "Webbed";

}

export class Bound extends Stuck { 
    name = "Bound";
}

export class Pinned extends Stuck {
    name = "Pinned";

}

export class Froze extends Stuck { 
    name = "Froze"

}

export class Puppeted extends Stuck {
    name = "Puppeted";

}

export class Petrified extends Stuck {
    name = "Petrified";

}