import { useEffect, useState } from "react";
import type { Battle, BattleResponse } from "../types/battle";
import { BattleView } from "../UserPages/BattleView";

interface BattleListItem extends Battle {
  id?: number;
}

export default function Overview() {
  const [battles, setBattles] = useState<BattleListItem[]>([]);
  const [selectedBattle, setSelectedBattle] = useState<BattleListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchBattles() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/battles", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch battles");
      }

      const json = (await res.json()) as BattleResponse;
      setBattles(json.data ?? []);
      console.log("Fetched: " + JSON.stringify(json, null, 2))
      if (!json.data?.length) {
        setSelectedBattle(null);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load battles right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBattles();
  }, []);

  function getHeroName(battle: BattleListItem) {
    return battle.winner.character.team === "hero"
      ? battle.winner.character.name
      : battle.loser.character.name;
  }

  function getVillainName(battle: BattleListItem) {
    return battle.winner.character.team === "villain"
      ? battle.winner.character.name
      : battle.loser.character.name;
  }

  async function handleDelete(battle: BattleListItem) {
    if (!battle.id) return;

    const confirmed = window.confirm(`Delete battle between ${getHeroName(battle)} and ${getVillainName(battle)}?`);
    if (!confirmed) return;

    try {
      const res = await fetch("/api/admin/delete/battle", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: battle.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? "Failed to delete battle");
      }

      setBattles((prev) => prev.filter((item) => item.id !== battle.id));
      if (selectedBattle?.id === battle.id) {
        setSelectedBattle(null);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to delete battle");
    }
  }

  return (
    <div className="appWrapper">
      <header className="topbar">
        <div className="topbar-title">Battle Overview</div>
        <div className="topbar-actions">
          <span className="topbar-status">{battles.length} saved battles</span>
          <button className="topbar-button" onClick={fetchBattles} disabled={loading}>
            {loading ? "Loading..." : "Reload"}
          </button>
        </div>
      </header>

      <div className="layout">
        <main className="content" style={{ padding: "1rem" }}>
          {error ? <p className="sidebar p">{error}</p> : null}

          {loading && !battles.length ? (
            <p>Loading battles...</p>
          ) : battles.length === 0 ? (
            <p>No battles have been saved yet.</p>
          ) : (
            <div className="battle-list">
              {battles.map((battle) => (
                <div className="overview-sidebar" key={battle.id ?? `${battle.winner.character.name}-${battle.loser.character.name}`}>
                  <div className="overview-info">
                    <p className="character-card-name">{getHeroName(battle)} vs {getVillainName(battle)}</p>
                    <p className="character-card-team">Winner: {battle.winner.character.name}</p>
                    <p className="character-card-team">Available: {battle.available_at || "Unknown"}</p>
                  </div>
                  <div className="character-card-actions">
                    <button className="tabButton" onClick={() => setSelectedBattle(battle)}>
                      Load
                    </button>
                    <button className="tabButton delete" onClick={() => handleDelete(battle)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <aside className="sidebar-right">
          <h2>Battle Details</h2>
          {selectedBattle ? (
            <BattleView
              battle={selectedBattle}
              winnerIcon={selectedBattle.winner.character.iconurl ?? ""}
              loserIcon={selectedBattle.loser.character.iconurl ?? ""}
            />
          ) : (
            <p>Select a battle to view its rounds.</p>
          )}
        </aside>
      </div>
    </div>
  );
}