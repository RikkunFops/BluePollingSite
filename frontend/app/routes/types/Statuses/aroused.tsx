import type { Character } from "../character";
import { getRandomInt } from "../status";
import BaseStatus, {StatusType} from "../baseStatus";
export class Aroused extends BaseStatus {
    constructor() {
        super(
            "Aroused",
            "Aroused",
            StatusType.Debuff,
            0,
            15,
            true,
            15,
            0
        );
    }

    getProcMessage(actor: Character): string {
        return actor.name + " is infatuated with their opponent, making it harder to attack and defend!";
    }

    doApply(actor: Character): Character {
        const finChar = actor;

        if (finChar.statuses[this.baseName] && getRandomInt(1, 100) <= 50) {
            finChar.statuses[this.baseName].value += 1;
        }
        else if (getRandomInt(1, 100) <= 50) {
            this.value = 1;
            finChar.statuses[this.baseName] = this;
        }

        return finChar;
    }

    doProc(actor: Character): Character {
        return actor;
    }
}

export class Horny extends Aroused {
    name = "Horny"
    getProcMessage(actor: Character): string {
        return actor.name + " is getting horny..."
    }
}

export class Pheromones extends Aroused {
    name = "Pheromones"
    getProcMessage(actor: Character): string {
        return actor.name + " is distracted by something in the air. It's making everything tingle..."
    }
}