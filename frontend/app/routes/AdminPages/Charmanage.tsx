import { useEffect, useState, type ChangeEvent } from "react";
import { type Character, type CharacterResponse, fields } from "../types/character";
import StatusSelector from "./Components/StatusSelector";
import BaseStatus from "../types/baseStatus";
import { CreateStatus, type statusConstructor } from "../types/status";
import { Hypnosis } from "../types/Statuses/hypno";
export default function Charmanage() {
  const [character, setCharacter] = useState<Character>({
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
    stuck: false,
    status: "",
    applies_statuses: [],
    statuses: {},
  });
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusList, setStatusList] = useState<BaseStatus[]>([]);

  async function fetchCharacters() {
      if (loading) return;

      setLoading(true);

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
      )
      const characters = response.data.map((character) => ({
          ...character,
          owner_tag: character.owner_tag ?? "",
          applies_statuses: JSON.parse(
              character.status || "[]"
          ).map(CreateStatus)
      }));

      setCharacters(characters);


      if (!response.data || response.data.length === 0) {
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

  useEffect(() => {
    if (!character.image || typeof character.image === "string") return;

    const url = URL.createObjectURL(character.image);

    return () => URL.revokeObjectURL(url);
  }, [character.image]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    const nextValue = type === "number" ? Number(value) : value;

    setCharacter((prev) => ({
      ...prev,
      [name === "owner" ? "owner_tag" : name]: nextValue,
    }));
  }


  async function handleSubmit(e: React.SubmitEvent) {
    console.log(statusList);
    e.preventDefault();

    
    const formData = new FormData();

    const hasExistingImage = Boolean(character.iconurl && character.iconurl.trim().length > 0);

    if (character.image && typeof character.image !== "string") {
      formData.append("image", character.image);
    } else if (!hasExistingImage) {
      formData.append("image", new File([], "", { type: "application/octet-stream" }));
    }
    formData.append("name", character.name);
    formData.append("iconurl", character.iconurl ?? "");
    formData.append("owner", character.owner_tag);
    formData.append("owner_tag", character.owner_tag);
    formData.append("desc", character.description);
    formData.append("team", character.team);
    formData.append("attack", String(character.attack));
    formData.append("defense", String(character.defense));
    formData.append("speed", String(character.speed));
    formData.append("style", String(character.style));
    formData.append("special", String(character.special));
    formData.append("status", JSON.stringify(statusList.map((status) => ({
      name: status.constructor.name,
      potency: status instanceof Hypnosis ? status.potency : undefined,
    }))));
  
    const res = await fetch("/api/admin/upload/actor", {
      method: "POST",
      credentials: "include",
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.message ?? "Failed to save character");
      return;
    }

    const saved = await res.json()
    console.log("Created: ", saved)
    await fetchCharacters();

    setCharacter({
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
      stuck: false,
      status: "",
      applies_statuses: [],
      statuses: {},
    });
    setStatusList([]);
  }

  function handleLoad(char: Character) {
    console.log("Loading: ", char)
    setCharacter({
      ...char,
      owner_tag: char.owner_tag ?? "",
      image: null,
    });
    setStatusList(char.applies_statuses ?? []);
  }

  async function handleDelete(char: Character) {
    if (!char.name) return;

    const confirmed = window.confirm(`Delete ${char.name}?`);
    if (!confirmed) return;

    try {
      const res = await fetch("/api/admin/delete/actor", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: char.name }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.message ?? "Failed to delete character");
        return;
      }

      setCharacters((prev) => prev.filter((item) => item.name !== char.name));
      if (character.name === char.name) {
        setCharacter({
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
          stuck: false,
          status: "",
          applies_statuses: [],
          statuses: {},
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete character");
    }
  }

  return (
    <div className="appWrapper">

      <header className="topbar">
        <div className="topbar-title">
          Character Manager
        </div>

        <div className="topbar-actions">
          <span className="topbar-status">
            Editing: {character.name || "New Character"}
          </span>

          <button className="topbar-button">
            Save
          </button>
        </div>
      </header>


      <div className="layout">

        <aside className="sidebar">
          {character.image && typeof character.image !== "string" ? (
            <img
              src={URL.createObjectURL(character.image)}
              alt={`${character.name} portrait`}
              style={{ width: "200px", borderRadius: "8px" }}
            />
          ) : character.iconurl ? (
            <img
              src={`http://localhost:3000${character.iconurl}`}
              alt={`${character.name} portrait`}
              style={{ width: "200px", borderRadius: "8px" }}
            />
          ) : null}

          <h2>{character.name || "Unnamed Character"}</h2>

          <h3>Description:</h3>
          <p>{character.description?.trim() || "No description"}</p>
          <h3>Owner: {character.owner_tag?.trim() || "No Owner tag"}</h3>
          <p></p>
          <h3>Stats</h3>

          <p>Team: {character.team}</p>
          <p>Speed: {character.speed}</p>
          <p>Attack: {character.attack}</p>
          <p>Defense: {character.defense}</p>
          <p>Style: {character.style}</p>
          <p>Special: {character.special}</p>

          <h3>Status Effects</h3>

          {character.applies_statuses.length > 0 ? (
            <ul className="status-list">
              {character.applies_statuses.map((status, index) => (
                <li key={index} className="status-display">
                  {status.name}
                  {status instanceof Hypnosis && (
                    
                    <span className="status-potency">
                      {" "}Potency: {status.potency}
                    </span>
                  )
                  
                  }
                  
                </li>
              ))}
            </ul>
          ) : (
            <p>No active statuses</p>
          )}
        </aside>


        <main className="content">

            <form className="charform" onSubmit={handleSubmit}>
                {fields.map((field) => (
                <label key={field.key}>
                    {field.label}

                    {field.type === "select" ? (
                    <select
                        name={field.key}
                        value={character[field.key as keyof Character] as string}
                        onChange={handleChange}
                    >
                        {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                        ))}
                    </select>

                    ) : field.type === "image" ? (

                    <input
                        type="file"
                        name={field.key}
                        accept="image/*"
                        onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const maxSizeMB = field.maxSizeMB ?? 5;
                        const maxSizeBytes = maxSizeMB * 1024 * 1024;

                        if (file.size > maxSizeBytes) {
                            alert(`Max file size is ${maxSizeMB}MB`);
                            return;
                        }

                        setCharacter((prev) => ({
                            ...prev,
                            [field.key]: file,
                        }));
                        }}
                    />

                    ) : field.type === "statusSelector" ? (
                        <StatusSelector value={statusList} onChange={setStatusList} />
                    ) : (
                    <input
                        type={field.type}
                        name={field.key === "owner" ? "owner_tag" : field.key}
                        value={
                          field.key === "owner"
                            ? character.owner_tag
                            : (character[field.key as keyof Character] as string | number)
                        }
                        onChange={handleChange}
                        minLength={field.type === "text" ? field.minLength : undefined}
                        maxLength={field.type === "text" ? field.maxLength : undefined}
                        min={field.type === "number" ? field.min : undefined}
                        max={field.type === "number" ? field.max : undefined}
                    />
                    )}
                </label>

                ))}

            <button
              className="topbar-button"
              type="submit"
            >
              Create Character
            </button>


          </form>

        </main>

        <aside className="sidebar-right">

                <p>Here you will be able to load new characters.</p>
                <button 
                onClick={fetchCharacters}
                className="topbar-button"
                disabled={loading}>
                  {loading ? "Loading..." : "Reload"}
                </button>
                <div>
                {characters.map((chars) => (
                  <div className="gridview-sidebar" key={chars.name}>
                    <img 
                      src={`http://localhost:3000${chars.iconurl}`} alt={chars.name} 
                      className="char-icon"/>
                    <div className="character-card-info">
                      <p className="character-card-name">{chars.name}</p>
                      <p className="character-card-team">{chars.team}</p>
                    </div>
                    <div className="character-card-actions">
                      <button className="tabButton" onClick={() => handleLoad(chars)}>Load</button>
                      <button className="tabButton delete" onClick={() => handleDelete(chars)}>Delete</button>
                    </div>
                  </div>
                ))}
                </div>
        </aside>

      </div>

    </div>
  );
}