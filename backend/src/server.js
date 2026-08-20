
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require("fs/promises");
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();


app.use(express.json());
app.use(express.static("public"));
app.use('/uploads', express.static(path.join(__dirname, "uploads")));
app.use('/battles', express.static(path.join(__dirname, "battles")));


app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET;

const bcrypt = require("bcryptjs");
const { error, Console } = require('console');

const HeroVillainDB = new sqlite3.Database("counter.db");


HeroVillainDB.serialize(() => {
    HeroVillainDB.run(`
        CREATE TABLE IF NOT EXISTS actor (
        iconurl TEXT NOT NULL,
        name TEXT PRIMARY KEY UNIQUE NOT NULL,
        owner_tag TEXT,
        description TEXT NOT NULL,
        team TEXT NOT NULL,
        attack INTEGER NOT NULL,
        defense INTEGER NOT NULL,
        speed INTEGER NOT NULL,
        style INTEGER NOT NULL,
        special INTEGER NOT NULL,
        status TEXT,
        votes INTEGER NOT NULL
        )`);

    HeroVillainDB.run(`PRAGMA foreign_keys = ON`);

    HeroVillainDB.run(`
        CREATE TABLE IF NOT EXISTS battle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        winner TEXT NOT NULL,
        loser TEXT NOT NULL,
        available_at TEXT NOT NULL,
        battle_json_url TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (winner) REFERENCES actor(name)
            ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (loser) REFERENCES actor(name)
            ON DELETE CASCADE ON UPDATE CASCADE,
        CHECK (winner != loser)
        )`);

    HeroVillainDB.run(`
        CREATE INDEX IF NOT EXISTS idx_battle_available_at
        ON battle(available_at)`);

    

    
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname); 
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const battleStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "battles"));
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random()*1e9)}.json`;
    cb(null,uniqueName);
  }
})

const statusStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "statuses"));
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random()*1e9)}.json`;
  }
})

const battleUpload = multer({
  storage: battleStorage,
  limits: {
    fileSize: 10*1024*1024
  },
   fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/json") {
      return cb(new Error("Only JSON files are allowed"));
    }
    cb(null, true);
   }
});
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req,file,cb) =>{
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);},
})


app.post('/api/print', (req, res) => {
    console.log("button pressed");
    res.json({message: "Printed to backend console"});
});

app.post('/api/admin/upload/battle', requireAdmin, battleUpload.single("battle"), (req, res) => {
  const { winner, loser, availableAt, available_at } = req.body;
  const availableAtValue = availableAt ?? available_at;

  console.log("Got request for battle upload", { winner, loser, availableAtValue, file: req.file?.originalname });

  if (!winner || !loser || !availableAtValue) {
    return res.status(400).json({ message: "winner, loser, and availableAt are required" });
  }

  // Validate the date is parseable before it ever reaches SQLite
  const parsedDate = new Date(availableAtValue);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: "availableAt must be a valid date" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Battle JSON file is required" });
  }

  const battleJsonUrl = `/battles/${req.file.filename}`;

  // Normalize to SQLite's canonical UTC format: 'YYYY-MM-DD HH:MM:SS'
  const sql = `
    INSERT INTO battle (winner, loser, available_at, battle_json_url)
    VALUES (?, ?, datetime(?), ?)
  `;

  HeroVillainDB.run(
    sql,
    [winner, loser, parsedDate.toISOString(), battleJsonUrl],
    function (err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        winner,
        loser,
        availableAt: parsedDate.toISOString(),
        battleJsonUrl
      });
    }
  );
});

app.post('/api/admin/upload/actor', requireAdmin, upload.single("image"), (req,res) => {
  const {
    name,
    owner,
    owner_tag,
    desc,
    team,
    health,
    attack,
    defense,
    speed,
    style,
    special,
    status = [],
    iconurl: iconurlFromBody = ""
  } = req.body;

  const ownerValue = owner_tag ?? owner ?? "";
  const statusJson = status;
  const sql = `
        INSERT INTO actor (
            name,
            owner_tag,
            iconurl,
            description,
            team,
            attack,
            defense,
            speed,
            style,
            special,
            status,
            votes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (name) DO UPDATE SET
            iconurl = excluded.iconurl,
            owner_tag = excluded.owner_tag,
            description = excluded.description,
            team = excluded.team,
            attack = excluded.attack,
            defense = excluded.defense,
            speed = excluded.speed,
            style = excluded.style,
            special = excluded.special,
            status = excluded.status,
            votes = excluded.votes;
    `;

  HeroVillainDB.get(
    "SELECT iconurl FROM actor WHERE name = ?",
    [name],
    (dbErr, existingRow) => {
      if (dbErr) {
        return res.status(500).json({ message: dbErr.message });
      }

      const iconurl = req.file
        ? `/uploads/${req.file.filename}`
        : (iconurlFromBody || existingRow?.iconurl || "");

      HeroVillainDB.run(
        sql,
        [
          name,
          ownerValue,
          iconurl,
          desc,
          team,
          Number(attack),
          Number(defense),
          Number(speed),
          Number(style),
          Number(special),
          statusJson,
          0
        ],
        function (err) {
      if (err) {
        return res.status(500).json({
          message: err.message
        })
      }
          res.status(201).json({
                    id: this.lastID,
                    iconurl,
                    name,
                    owner: ownerValue,
                    description: desc,
                    team,
                    health: Number(health),
                    attack: Number(attack),
                    defense: Number(defense),
                    speed: Number(speed),
                    style: Number(style),
                    special: Number(special),
                    statuses: null,
                    votes: 0
                });
        }
      );
    }
  );
});

app.post('/api/admin/delete/actor', requireAdmin, (req, res) => {
  const { name } = req.body || {};

  if (!name) {
    return res.status(400).json({ message: "Character name is required" });
  }

  const sql = `DELETE FROM actor WHERE name = ?`;

  HeroVillainDB.run(sql, [name], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Character not found" });
    }

    res.json({ success: true, message: `Deleted ${name}` });
  });
});

app.post('/api/characters', (req,res) => {
  const sql = "SELECT * FROM actor";

  HeroVillainDB.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  });
});

app.post('/api/battles/public', (req, res) => {
  const sql = "SELECT * FROM battle WHERE available_at <= datetime('now')";
  console.log(new Date().toString())
  HeroVillainDB.all(sql, [], async (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
    const battles = await Promise.all(
      rows.map(async (row) => {
        const filePath = path.join(__dirname, row.battle_json_url.replace(/^\/+/, ""));

        const battle = JSON.parse(
          await fs.readFile(filePath, "utf8")
        );  
        
        return {
          id: row.id,
          winner: battle.winner,
          loser: battle.loser,
          starting_health: battle.starting_health ?? battle.startingHealth,
          available_at: row.available_at,
          rounds: (battle.rounds ?? []).map(round => ({
            round_no: round.round_no ?? round.roundNo,
            First: round.First,
            Second: round.Second,
            turns: round.turns,
          })),
        };
      })
    );
    res.json({
      success: true,
      count: battles.length,
      data: battles
    });
  });
});

app.post('/api/battles', requireAdmin, (req,res) => {
  const sql = "SELECT * FROM battle";

  HeroVillainDB.all(sql, [], async (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    const battles = await Promise.all(
      rows.map(async (row) => {
        const filePath = path.join(__dirname, row.battle_json_url.replace(/^\/+/, ""));

        const battle = JSON.parse(
          await fs.readFile(filePath, "utf8")
        );

        return {
          id: row.id,
          winner: battle.winner,
          loser: battle.loser,
          starting_health: battle.starting_health ?? battle.startingHealth,
          available_at: row.available_at,
          rounds: (battle.rounds ?? []).map(round => ({
            round_no: round.round_no ?? round.roundNo,
            First: round.First,
            Second: round.Second,
            turns: round.turns,
          })),
        };
      })
    );

    res.json({
      success: true,
      count: battles.length,
      data: battles
    });
  });
})

app.post('/api/admin/delete/battle', requireAdmin, (req, res) => {
  const { id } = req.body || {};

  if (!id) {
    return res.status(400).json({ message: "Battle id is required" });
  }

  const sql = `DELETE FROM battle WHERE id = ?`;

  HeroVillainDB.run(sql, [id], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Battle not found" });
    }

    res.json({ success: true, message: `Deleted battle ${id}` });
  });
});

app.post('/api/login', async (req, res) => {
  try {
    const { password } = req.body;
    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!password || !hash) {
      return res.status(500).json({ error: 'Server misconfigured' });
    }
    const match = await bcrypt.compare(password, hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax", secure: false });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

function requireAdmin(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

app.get("/api/me", requireAdmin, (req,res) => {
  res.json({user: req.user});
})

app.get("/api/counter",(req,res) => {
    const id = parseInt(req.query.id);
})

app.get("/", (req, res) => {
  console.log("Backend is Running");  
  res.send("Backend is running");
    
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));