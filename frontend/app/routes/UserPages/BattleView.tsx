import { useState } from "react";
import type { Battle } from "../types/battle";
import { RoundView } from "./RoundView";

export function BattleView({
  battle,
  winnerIcon,
  loserIcon,
}: {
  battle: Battle;
  winnerIcon: string;
  loserIcon: string;
}) {
  const [collapsed, setCollapsed] = useState(true);

  const getImageSrc = (iconUrl: string | null) =>
    iconUrl || "/uploads/placeholder.png";

  return (
    <div className={`BattleContainer${collapsed ? " collapsed" : ""}`}>
      <div className="BattleHeader" onClick={() => setCollapsed((c) => !c)}>
        <h1>Winner:</h1>
        <div className="Winner">
          <img
            className="Winner-icon"
            src={getImageSrc(winnerIcon || battle.winner.character.iconurl)}
          />
          <div>{battle.winner.character.name}</div>
        </div>

        <h1>Loser:</h1>
        <div className="Loser">
          <img
            className="Loser-icon"
            src={getImageSrc(loserIcon || battle.loser.character.iconurl)}
          />
          <div>{battle.loser.character.name}</div>
        </div>

        <div>Starting health: {battle.starting_health}</div>
        <div>Available at: {battle.available_at}</div>
      </div>
      <div className="BattleBody">
        {battle.rounds.map((round, i) => (
          <RoundView key={i} round={round} />
        ))}
      </div>
    </div>
  );
}