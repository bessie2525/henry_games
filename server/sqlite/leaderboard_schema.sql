PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS challenge_leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL DEFAULT '',
  game_type TEXT NOT NULL,
  max_level INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_type)
);

CREATE TABLE IF NOT EXISTS fixed_leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL DEFAULT '',
  game_type TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  best_accuracy REAL NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_type, difficulty, question_count)
);
