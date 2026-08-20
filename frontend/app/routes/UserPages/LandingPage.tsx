import { useEffect, useState } from "react";
import type { Route } from "./+types/LandingPage";
import type { Battle, BattleResponse} from "../types/battle";
import { type Character, type CharacterResponse } from "../types/character";
import { BattleView } from "./BattleView";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TROEVL Tournament" },
    { name: "Tournament results viewing", content: "View the results..." },
  ];
}
export default function LandingPage() {
  const [characters, setCharacters] = useState<Record<string, Character>>({});
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [loadingBattles, setLoadingBattles] = useState(false);

  async function fetchCharacters() {
    if (loadingCharacters) return;
    setLoadingCharacters(true);

    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch characters");

      const json = await res.json();
      const response = json as CharacterResponse;
      const mappedChars: Record<string, Character> = response.data.reduce(
        (acc, char) => {
          acc[char.name] = char;
          return acc;
        },
        {} as Record<string, Character>
      );

      setCharacters(mappedChars);
      console.log("Fetched:", response);

      if (!response.data || response.data.length === 0) {
        console.error("Invalid backend data", response);
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCharacters(false);
    }
  }

  async function fetchBattles() {
    if (loadingBattles) return;
    setLoadingBattles(true);

    try {
      const res = await fetch("/api/battles/public", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch battles");

      const json = await res.json();
      const response = json as BattleResponse;
      console.log(response);

      const mappedBattles: Battle[] = (response.data ?? []).map((battle) => {
        const battleData = battle as Battle & {
          startingHealth?: number;
          starting_health?: number;
          available_at?: string;
          rounds?: Array<
            {
              roundNo?: number;
              round_no?: number;
              First: Battle["winner"];
              Second: Battle["winner"];
              turns?: Array<{
                actor: Battle["winner"];
                action: number;
                success: boolean;
                attack: number;
                defense: number;
                damage: number;
                turnMessage?: string;
              }>;
            }
          >;
        };

        return {
          winner: battle.winner,
          loser: battle.loser,
          starting_health: battleData.starting_health ?? battleData.startingHealth ?? 0,
          available_at: battleData.available_at ?? "",
          rounds: (battleData.rounds ?? []).map((round) => ({
            round_no: round.round_no ?? round.roundNo ?? 0,
            First: round.First,
            Second: round.Second,
            turns: (round.turns ?? []).map((turn) => ({
              actor: turn.actor,
              action: turn.action,
              success: turn.success,
              attack: turn.attack,
              defense: turn.defense,
              damage: turn.damage,
              turnMessage: turn.turnMessage ?? "",
            })),
          })),
        };
      });

      setBattles(mappedBattles);
      console.log("Fetched:", mappedBattles);

      if (!response.data || response.data.length === 0) {
        console.error("Invalid backend data", response);
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBattles(false);
    }
  }

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    fetchBattles();
  }, []);

  return (
    <>


      <div className="ListContainer">
        {battles.map((battle, i) => (
          <BattleView
            key={`battle-${i}`}
            battle={battle}
            winnerIcon={battle.winner.character.iconurl as string}
            loserIcon={battle.loser.character.iconurl as string}
          />
        ))}
      </div>
    </>
  );
}