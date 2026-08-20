import { useState } from "react";
import type { Turn } from "../types/battle";
import { Action } from "../types/battle";

export function TurnView({ turn }: { turn: Turn }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className={`TurnContainer${collapsed ? " collapsed" : ""}`}>
      <div className="TurnHeader" onClick={() => setCollapsed((c) => !c)}>
        <h2>Action: {Action[turn.action]}</h2>
      </div>
      <div className="TurnBody">
        <h3>Actor: {turn.actor.character.name}</h3>
        <p>Did succeed: {turn.success ? "Yes" : "No"}</p>
        <p>Attacker rolled: {turn.attack}</p>
        <p>Defender rolled: {turn.defense}</p>
        <p>Damage dealt: {turn.damage}</p>
        <p>Message: {turn.turnMessage}</p>
      </div>
    </div>
  );
}
