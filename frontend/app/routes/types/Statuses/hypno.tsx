import type { Character } from "../character";
import { getRandomInt } from "../status";
import BaseStatus, {StatusType} from "../baseStatus";

export class Hypnosis extends BaseStatus  {
    constructor() {
        super(
            "Hypnosis",
            "Hypnosis",
            StatusType.Debuff,
            0,
            15,
            true,
            3,
            0
        );
    }

    potency = 0;

    getProcMessage(actor: Character): string {
        return actor.name + " cannot act! They're too deeply hypnotised!"
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
                const status = new (this.constructor as new () => typeof this)();
                status.stacks = 1;
                finChar.statuses[this.baseName] = status;
            }
        }
        return finChar
    }


    doProc(actor: Character): Character {
        const finChar : Character = actor
        this.value += getRandomInt(1, this.potency);
        if (this.value < 5) {
            finChar.speed -= 1;
            finChar.attack -=1;
            finChar.defense -= 1;
            const rng = getRandomInt(1,4);
            if (rng >= 4) {
                finChar.missAttack = true;
            }
            else {
                finChar.missAttack = false;
            }
        }
        else if (this.value >5 && this.value < 10) {
            finChar.speed -= 1;
            finChar.attack -=1;
            finChar.defense -= 1;


            const rng = getRandomInt(1,2);
            if (rng >= 3) {
                finChar.missAttack = true;
            }
            else {
                finChar.missAttack = false;
            }

        }
        else if (this.value > 10) {
            finChar.speed -= 1;
            finChar.attack -=1;
            finChar.defense -= 1;
            const rng = getRandomInt(1,2);
            if (rng >= 2) {
                finChar.missAttack = true;
            }
            else {
                finChar.missAttack = false;
            }

        }
        return finChar;

    }
}

export class Corruption extends Hypnosis {
    name = "Corruption";
    override getProcMessage(actor: Character): string {
        return actor.name + " is succumbing to corruption! They can't act!";
    }
}

export class Brainwashed extends Hypnosis {
    override getProcMessage(actor: Character): string {
        return actor.name + " is being brainwashed! They don't even want to act...";
    }
}

export class Droned extends Hypnosis {
    override getProcMessage(actor: Character): string {
        return "Drone programming is overwhelming " + actor.name + "'s mind. They can't act.";
    }
}

export class Entranced extends Hypnosis {

}

export class Zombie extends Hypnosis {

}

export class Possessed extends Hypnosis {
    
}