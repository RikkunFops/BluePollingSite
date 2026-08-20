import { useEffect, useState } from "react";
import type { Route } from "./+types/AdminBase";
import Overview from "./Overview";
import Charmanage from "./Charmanage";
import Scheduling from "./Battling";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Blue Polling Control Panel" },
    { name: "description", content: "Polling control panel" },
  ];
}
export default function Home() {
  const [status, setStatus] = useState("Not Logged In");
  const [isAuthed, setIsAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview")
  const [password, setPassword] = useState("");
  const tabs = [
    { id: "overview", title: "Overview"},
    { id: "charmanage", title: "Character Manager"},
    { id: "scheduling", title: "Poll Scheduler"}
  ]
  function renderContent() {
  switch (activeTab) {
    case "overview":
      return <Overview />;

    case "charmanage":
      return <Charmanage />;

    case "scheduling":
      return <Scheduling />;

    default:
      return null;
  }
}

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include"
        });

        setIsAuthed(res.ok);
      } catch {
        setIsAuthed(false);
      }
    }

    checkAuth();
  }, []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error ?? "Login failed");
      return;
    }

    setStatus("Logged in");
    setIsAuthed(true);
  } catch (err) {
    setStatus("Unable to reach server");
    console.error(err);
  }
}

  
  const handleClick = async () => {
    try {
      const res = await fetch("/api/print", { method: "POST" });
      const data = await res.json();
      setStatus(data.message);
    } catch (err) {
      setStatus("Error reaching server");
      console.error(err);
    }
  };

  if (!isAuthed) {
    return (
      <div className="loginScreen">
        <h1>Blue Polling Control Panel</h1>

        <form onSubmit={handleLogin}>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>

        <p>{status}</p>
      </div>
    );
  }

  return (
    <div className="appWrapper">
      {/* TOP BAR */}
      <header className="topbar">
        <div className="topbar-title">Blue Polling Control Panel</div>
        <div className="topbar-title">{status}</div>
        
      </header>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tabButton ${
                activeTab === tab.id ? "active" : ""
              }`}
            >
              {tab.title}
            </button>
          ))}
        </aside>
        {/* CONTENT PANEL */}
        <main className="content">{renderContent()}</main>
      </div>
    </div>
  );
}