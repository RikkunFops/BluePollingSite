import React, { act, useEffect, useState } from "react";
import type BaseStatus from "../types/baseStatus";
import { type Character, type CharacterResponse } from "../types/character";
import { Action, type Turn, type Round, type Battle, type Actor } from "../types/battle";
import { type statusConstructor, CreateStatus, effectRegRegistry, getRandomInt } from "../types/status";
import { prefix } from "@react-router/dev/routes";
interface SimResults {
    battle: Battle;
    winner: string;
}

function randomInt(min: number, max: number): number {
  // inclusive of both min and max
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function getRollValue(baseStat: number, style: number, modifier: number = 0): number {
    return Math.max(1, randomInt(1, 10) + baseStat + style - modifier);
}

function computeSuccessChance(AttackerStat: number, DefenderStat: number): number {
    const diff = AttackerStat - DefenderStat;
    return clamp(0.5+diff / 200, 0.1, 0.9)
}

function cloneStatus<T extends BaseStatus>(status: T): T {
    const cloned = Object.create(Object.getPrototypeOf(status)) as T;
    Object.assign(cloned, status);
    return cloned;
}

function cloneCharacter(character: Character): Character {
    return {
        ...character,
        applies_statuses: character.applies_statuses.map((status) => cloneStatus(status)),
        statuses: Object.fromEntries(
            Object.entries(character.statuses).map(([key, status]) => [key, cloneStatus(status)])
        ),
    };
}

function cloneActor(actor: Actor): Actor {
    return {
        ...actor,
        character: cloneCharacter(actor.character),
    };
}

function normalizeCharacter(character: Character): Character {
    return {
        ...character,
        applies_statuses: character.applies_statuses ?? [],
        statuses: character.statuses ?? {},
        stuck: Boolean(character.stuck),
        missAttack: Boolean(character.missAttack),
    };
}

export default function Battling() {
    const emptyChar: Character = {
    id: 0,
    name: "",
    owner_tag: "",
    image: null,
    iconurl: null,
    description: "",
    team: "hero",
    attack: 0,
    defense: 0,
    speed: 0,
    style: 0,
    special: 0,
    missAttack: false,
    status: "",
    stuck: false,
    applies_statuses: [],
    statuses: {},
    };

    const [actor1, setActor1] = useState<Character>(emptyChar);
    const [actor2, setActor2] = useState<Character>(emptyChar);
    const [starting_health, setHealth] = useState<number>(30);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [simError, setSimError] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [battleResult, setBattleResult] = useState<Battle | null>(null);
    const [datetime, setDatetime] = useState<string>("");

    function isEmpty(actor: Character): boolean {
        return !actor.name || actor.name.trim() === emptyChar.name;
    }

    function getActorKey(actor: Character): string {
        return (actor.name ?? "").trim().toLowerCase();
    }

    function isSameActor(actorA: Character, actorB: Character): boolean {
        const keyA = getActorKey(actorA);
        const keyB = getActorKey(actorB);

        return Boolean(keyA && keyB && keyA === keyB);
    }

    function simulateBattle(): Battle {
        let Battle : Battle | null = null;

        let bActor1 : Actor = {
            character: normalizeCharacter(actor1),
            health: starting_health,
        };
        let bActor2 : Actor = {
            character: normalizeCharacter(actor2),
            health: starting_health,
        }

        let winner :Actor | null = null;
        const rounds: Round[] = [];
        let roundNo = 1;
        let maxRounds = 99;

        const baseActor1 = structuredClone(normalizeCharacter(actor1));
        const baseActor2 = structuredClone(normalizeCharacter(actor2));

        while (bActor1.health > 0 && bActor2.health > 0 && roundNo <= maxRounds) {
            bActor1.character = {
                ...bActor1.character,
                speed: baseActor1.speed,
                attack: baseActor1.attack,
                defense: baseActor1.defense,
                special: baseActor1.special,
                style: baseActor1.style,
                missAttack: false
            }

            bActor2.character = {
                ...bActor2.character,
                speed: baseActor2.speed,
                attack: baseActor2.attack,
                defense: baseActor2.defense,
                special: baseActor2.special,
                style: baseActor2.style,
                missAttack: false
            }

            const turns: Turn[] = []

            Object.values(bActor1.character.statuses).forEach(status => {
                status.doProc(bActor1.character);
            })
            Object.values(bActor2.character.statuses).forEach(status => {
                status.doProc(bActor2.character);
            })

            const Actor1Roll = getRollValue(bActor1.character.speed, 0, 0)
            const Actor2Roll = getRollValue(bActor2.character.speed, 0, 0)

            // Speed determines initiative order each round; ties broken randomly
            let first: Actor;
            if (Actor1Roll === Actor2Roll) {
                // Speed rolls tied, break randomly
                first = Math.random() < 0.5 ? bActor1 : bActor2;
            } else {
                first = Actor1Roll > Actor2Roll ? bActor1 : bActor2;
            }
            let second = first === bActor1 ? bActor2 : bActor1;
            

            // If the first actor is locked, check if they switch
            if (first.character.statuses["Locked"]) {
                
                if (getRandomInt(1,100) <= 50) {
                    const preFirst = first
                    const preSec = second

                    first = preSec;
                    second = preFirst;
                    turns.push({
                        actor: cloneActor(preFirst),
                        action: Action.Status,
                        attack: 0,
                        defense: 0,
                        success: true,
                        damage: 0,
                        turnMessage: preFirst.character.statuses["Locked"].getProcMessage(preFirst.character)
                    })
                }
            }

            let shouldResolveAttack = true;
            
            // Resolve a single turn per round based on initiative order.
            const attacker = first;
            const defender = second;

            


            if (attacker.character.stuck) {
                if (getRandomInt(1, 2) === 1) {
                    turns.push({
                        actor: cloneActor(attacker),
                        action: Action.Status,
                        success: false,
                        attack: 0,
                        defense: 0,
                        damage: 0,
                        turnMessage: attacker.character.statuses["Stuck"].getProcMessage(attacker.character)
                    })
                    shouldResolveAttack = false;
                } else {
                    delete attacker.character.statuses["Stuck"];
                    attacker.character.attack += 3;
                    attacker.character.defense += 3;
                    turns.push({
                        actor: cloneActor(attacker),
                        action: Action.Status,
                        success: true,
                        attack: 0,
                        defense: 0,
                        damage: 0,
                        turnMessage: `${attacker.character.name} broke free!`
                    })
                }
            }

            if (attacker.character.statuses["Poison"]) {
                    const psn = getRandomInt(1, 3);
                    attacker.health -= psn;
                    turns.push({
                        actor: cloneActor(attacker),
                        action: Action.Status,
                        success: true,
                        attack: 0,
                        defense: 0,
                        damage: psn,
                        turnMessage: attacker.character.statuses["Poison"].getProcMessage(attacker.character)
                    })
                }
            if (defender.character.statuses["Poison"]) {
                    const psn = getRandomInt(1, 3);
                    defender.health -= psn;
                    turns.push({
                        actor: cloneActor(defender),
                        action: Action.Status,
                        success: true,
                        attack: 0,
                        defense: 0,
                        damage: psn,
                        turnMessage: defender.character.statuses["Poison"].getProcMessage(defender.character)
                    })
                }

            if (shouldResolveAttack) {
                

                // Calculate the final attack stats for the single turn.
                let attackerStat = getRollValue(
                    attacker.character.attack,
                    attacker.character.style,
                    attacker.character.statuses["Aroused"]?.value ?? 0
                );
                let defenderStat = getRollValue(
                    defender.character.defense,
                    defender.character.style,
                    defender.character.statuses["Aroused"]?.value ?? 0
                );

                if (attackerStat >= defenderStat) {
                    const dmg = attackerStat - defenderStat;
                    defender.health -= dmg;
                    turns.push({
                        actor: cloneActor(attacker),
                        action: Action.Attack,
                        success: true,
                        attack: attackerStat,
                        defense: defenderStat,
                        damage: dmg,
                        turnMessage: `${attacker.character.name} hit ${defender.character.name} for ${dmg}!`
                    })

                    attacker.character.applies_statuses.forEach(element => {
                        defender.character = element.doApply(defender.character);

                        if (defender.character.statuses[element.name]) {
                            turns.push({
                                actor: cloneActor(defender),
                                action: Action.Status,
                                success: true,
                                attack: attackerStat,
                                defense: defenderStat,
                                damage: 0,
                                turnMessage: `${attacker.character.name} applied ${element.name} to ${defender.character.name}`
                            });
                        }
                    });

                    if (attacker.character.statuses["Enraged"]) {
                        const rng = getRandomInt(1, 100);
                        const dmg = getRandomInt(1, 3);
                        if (rng <= 50) {
                            attacker.health -= dmg;
                            turns.push({
                                actor: cloneActor(attacker),
                                action: Action.Status,
                                success: true,
                                attack: attackerStat,
                                defense: defenderStat,
                                damage: dmg,
                                turnMessage: attacker.character.statuses["Enraged"].getProcMessage(attacker.character)
                            })
                        }
                    }
                } 
                else {
                    if (attacker.character.missAttack && attacker.character.statuses["Hypnosis"]) {
                        turns.push({
                            actor: cloneActor(attacker),
                            action: Action.Status,
                            success: false,
                            attack: attackerStat,
                            defense: defenderStat,
                            damage: 0,
                            turnMessage: attacker.character.statuses["Hypnosis"].getProcMessage(attacker.character)
                        })
                    } else {
                        turns.push({
                            actor: cloneActor(attacker),
                            action: Action.Attack,
                            success: false,
                            attack: attackerStat,
                            defense: defenderStat,
                            damage: 0,
                            turnMessage: `${attacker.character.name} missed their attack!`
                        })
                    }

                    const counterAttackerStat = getRollValue(
                        defender.character.special,
                        defender.character.style,
                        defender.character.statuses["Aroused"]?.value ?? 0
                    );
                    const counterDefenderStat = getRollValue(
                        attacker.character.defense,
                        attacker.character.style,
                        attacker.character.statuses["Aroused"]?.value ?? 0
                    );
                    
                    if (defender.character.stuck) {
                            if (getRandomInt(1, 2) === 1) {
                                turns.push({
                                    actor: cloneActor(attacker),
                                    action: Action.Status,
                                    success: false,
                                    attack: counterAttackerStat,
                                    defense: counterDefenderStat,
                                    damage: 0,
                                    turnMessage: defender.character.statuses["Stuck"].getProcMessage(attacker.character)
                                })
                            } else {
                                delete defender.character.statuses["Stuck"];
                                defender.character.attack += 3;
                                defender.character.defense += 3;
                                turns.push({
                                    actor: cloneActor(defender),
                                    action: Action.Status,
                                    success: true,
                                    attack: 0,
                                    defense: 0,
                                    damage: 0,
                                    turnMessage: `${defender.character.name} broke free!`
                                })
                            }
                        }

                    if (counterAttackerStat > counterDefenderStat && defender.health > 0) {
                        
                        const dmg = counterAttackerStat - counterDefenderStat;
                        attacker.health -= dmg;
                        turns.push({
                            actor: cloneActor(defender),
                            action: Action.Counter,
                            success: true,
                            attack: counterAttackerStat,
                            defense: counterDefenderStat,
                            damage: dmg,
                            turnMessage: `${defender.character.name} counters! They deal ${dmg} damage.`
                        })
                        defender.character.applies_statuses.forEach(element => {
                        attacker.character = element.doApply(attacker.character);

                        if (attacker.character.statuses[element.name]) {
                                turns.push({
                                    actor: cloneActor(attacker),
                                    action: Action.Status,
                                    success: true,
                                    attack: attackerStat,
                                    defense: defenderStat,
                                    damage: 0,
                                    turnMessage: `${defender.character.name} applied ${element.name} to ${attacker.character.name}`
                                });
                            }
                        });
                        if (defender.character.statuses["Enraged"]) {
                            const rng = getRandomInt(1, 100);
                            const dmg = getRandomInt(1, 3);
                            if (rng <= 50) {
                                defender.health -= dmg;
                                turns.push({
                                    actor: cloneActor(defender),
                                    action: Action.Status,
                                    success: true,
                                    attack: attackerStat,
                                    defense: defenderStat,
                                    damage: dmg,
                                    turnMessage: defender.character.statuses["Enraged"].getProcMessage(defender.character)
                                })
                            }
                        }
                    }
                }
            }

            // Check if someone won after the single turn.
            if (bActor1.health <= 0 || bActor2.health <= 0) {
                winner = bActor1.health > 0 ? bActor1 : bActor2;
            }

            rounds.push({
                round_no: roundNo,
                First: cloneActor(first),
                Second: cloneActor(second),
                turns: turns
            })
            roundNo++;

            if (winner != null) {
                Battle = {
                    available_at: datetime,
                    winner: winner,
                    loser: winner === bActor1 ? bActor2 : bActor1,
                    starting_health: starting_health,
                    rounds: rounds
                }
                break;
            }
 
        }

        if (Battle === null) {
            // Tiebreaker, for if max round limit is reached
            let winner: Actor;
            let loser: Actor;

            if (bActor1.health === bActor2.health) {
                let rollA: number, rollB: number;
                do {
                    rollA = randomInt(1,20) + bActor1.character.style;
                    rollB = randomInt(1,20) + bActor2.character.style;
                } while (rollA === rollB);

                winner = rollA > rollB ? bActor1 : bActor2;
                loser = rollA > rollB ? bActor2 : bActor1;
            } else {
                winner = bActor1.health > bActor2.health ? bActor1 : bActor2;
                loser = bActor1.health > bActor2.health ? bActor2 : bActor1;
            }

            Battle = { 
                winner: winner, 
                loser: loser, 
                starting_health: starting_health, 
                available_at : "", 
                rounds: rounds };
        }
        
        return Battle as Battle;
    }


    async function handleSimulateBattle() {
        console.log("Wap")
        
        setSimError(null);
        setUploadError(null);

        if (isEmpty(actor1) || isEmpty(actor2)) {
            setSimError("Please select two characters before simulating.")
            console.error(simError)
            return;
        }
        if (isSameActor(actor1, actor2)) {
            setSimError("Please choose two different characters.");
            return;
        }
        if (starting_health <= 0) {
            setSimError("Starting health must be greater than zero.");
            console.error(simError)
            return;
        }
        if (datetime == "") {
            setSimError("Please choose a future date and time for the battle.");
            return;
        }
        console.log(`Starting fight: ${actor1.name} and ${actor2.name}`)

        const selectedTime = new Date(datetime).getTime();

        if (selectedTime < Date.now()) {
            setSimError("The selected date and time must be in the future.");
            return;
        }
        let result: Battle;

        try {
            result = simulateBattle();
            setBattleResult(result);
        } catch (error) {
            const message = error instanceof Error ? error.message : "The battle simulation failed unexpectedly.";
            setSimError(message);
            return;
        }
        
        const battleFile = new File(
            [JSON.stringify(result, null, 2)],
            "battle.json",
            { type: "application/json" }
        )
        const availableAtUtc = new Date(datetime).toISOString()
        const formData = new FormData();
        if (result) {
            formData.append("actorOne", actor1.name.trim());
            formData.append("actorTwo", actor2.name.trim());
            formData.append("winner", result.winner.character.name);
            formData.append("loser", result.loser.character.name);
            formData.append("available_at", availableAtUtc);
            formData.append("battle", battleFile);
            const res = await fetch("/api/admin/upload/battle", {
                method: "POST",
                credentials: "include",
                body: formData,
            })

            if (!res.ok) {
                const errText = await res.text();
                console.error("Battle upload failed", errText);
                try {
                    const err = JSON.parse(errText);
                    setUploadError(err.message ?? "The battle could not be uploaded. Please try again.");
                } catch {
                    setUploadError(errText || "The battle could not be uploaded. Please try again.");
                }
                return;
            }

            const saved = await res.json();
            console.log("Uploaded: ", saved);

        }

    }
    
    async function fetchCharacters() {
          try {
            const res = await fetch("/api/characters", {
              method: "POST",
              credentials: "include",
            });
    
            if (!res.ok) throw new Error("Failed to fetch characters");
    
          const json = await res.json();
            const response = json as CharacterResponse;
            console.log(
                "fetched:",
                JSON.stringify(response.data, null, 2)
            );
            const mappedCharacters = response.data.map((character) => {
                const appliesStatuses = JSON.parse(character.status || "[]").map(CreateStatus);

                return normalizeCharacter({
                    ...character,
                    applies_statuses: appliesStatuses,
                    statuses: {},
                });
            });

            setCharacters(mappedCharacters);
    
          if (!response.data || response.data.length === 0) {
            setCharacters([]);
            console.error("Invalid backend data", response);
            return;
          }
    
          } catch (err) {
            console.error(err);
          } finally {
            setLoading(false);
          }
        }

    useEffect(() => {
    fetchCharacters()
    }, [])

    function capitalise(str: string) {
        return str.charAt(0).toLocaleUpperCase() + str.slice(1).toLowerCase();
    }

    

    const handleActor1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedChar = characters?.find(
            char => char.name === e.target.value);
        console.log(selectedChar);
        if (selectedChar) {
            setActor1(selectedChar);
        }
    }
    const handleActor2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedChar = characters?.find(
            char => char.name === e.target.value);
        console.log(selectedChar);
        if (selectedChar) {
            setActor2(selectedChar);
        }
    }

    return (
        <div className="battlePageBody">
            <div className="battlePageHeader">
                <h1>Battle Simulator</h1>
                <p>Schedule a battle, review the matchup, and save the result.</p>
            </div>

            <div className="battlerWindow">
                <div className="battlePanel">
                    <div className="battleActor" id="actor1">
                        <select
                            id="actor1-selector"
                            className="battleIconSelector"
                            onChange={handleActor1Change}
                            value={actor1.name}
                        >
                            <option value=""> --- </option>
                            {characters?.map((chars) => (
                                <option className="battleActorOption" key={chars.name} value={chars.name}>
                                    {chars.name}
                                </option>
                            ))}
                        </select>
                        <img className="battleActorIcon" id="actor1-icon" src={actor1?.iconurl || "/uploads/placeholder.png"} />
                        <h2 className="battleActorName" id="actor1-name">{capitalise(actor1.name) || "Select a hero"}</h2>
                        <p className="battleActorTeam" id="actor1-team">{capitalise(actor1.team) || "Hero"}</p>
                        <table className="battleActorTable" id="actor1-table">
                            <thead>
                                <tr>
                                    <th>Attack</th>
                                    <th>Defense</th>
                                    <th>Speed</th>
                                    <th>Special</th>
                                    <th>Style</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{actor1.attack}</td>
                                    <td>{actor1.defense}</td>
                                    <td>{actor1.speed}</td>
                                    <td>{actor1.special}</td>
                                    <td>{actor1.style}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="battleControls">
                    <label htmlFor="battle-datetime" style={{ width: "100%" }}>
                        <span style={{ display: "block", marginBottom: "0.35rem", color: "#cbd5e1" }}>Available date</span>
                        <input
                            id="battle-datetime"
                            type="datetime-local"
                            value={datetime}
                            onChange={(e) => setDatetime(e.target.value)}
                        />
                    </label>

                    <button onClick={handleSimulateBattle}>Simulate Battle</button>

                    {(simError || uploadError) && (
                        <div style={{ color: "#fca5a5", fontWeight: 600, lineHeight: 1.5, textAlign: "center" }}>
                            {simError || uploadError}
                        </div>
                    )}
                </div>

                <div className="battlePanel">
                    <div className="battleActor" id="actor2">
                        <select
                            id="actor2-selector"
                            className="battleIconSelector"
                            onChange={handleActor2Change}
                            value={actor2.name}
                        >
                            <option value=""> --- </option>
                            {characters?.map((chars) => (
                                <option className="battleActorOption" key={chars.name} value={chars.name}>
                                    {chars.name}
                                </option>
                            ))}
                        </select>
                        <img className="battleActorIcon" id="actor2-icon" src={actor2?.iconurl || "/uploads/placeholder.png"} />
                        <h2 className="battleActorName" id="actor2-name">{capitalise(actor2.name) || "Select a villain"}</h2>
                        <p className="battleActorTeam" id="actor2-team">{capitalise(actor2.team) || "Villain"}</p>
                        <table className="battleActorTable" id="actor2-table">
                            <thead>
                                <tr>
                                    <th>Attack</th>
                                    <th>Defense</th>
                                    <th>Speed</th>
                                    <th>Special</th>
                                    <th>Style</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{actor2.attack}</td>
                                    <td>{actor2.defense}</td>
                                    <td>{actor2.speed}</td>
                                    <td>{actor2.special}</td>
                                    <td>{actor2.style}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}