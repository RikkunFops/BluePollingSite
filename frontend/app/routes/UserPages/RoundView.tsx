import { useState } from "react";
import type { Round } from "../types/battle";
import { TurnView } from "./TurnView";

export function RoundView({ round }: { round: Round }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div className={`RoundContainer${collapsed ? " collapsed" : ""}`}>
      <div className="RoundHeader" onClick={() => setCollapsed((c) => !c)}>
        <h2>Round {round.round_no}</h2>
      </div>
      <div className="RoundBody">
        <h3>Attacker: {round.First.character.name} - {round.First.health}</h3>
        <h3>Defender: {round.Second.character.name} - {round.Second.health}</h3>
        {round.turns.map((turn, i) => (
          <TurnView key={`${round.round_no}-turn-${i}`} turn={turn} />
        ))}
      </div>
    </div>
  );
}