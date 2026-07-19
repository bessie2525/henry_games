PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS challenge_leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT NOT NULL DEFAULT '',
  game_type TEXT NOT NULL,
  max_level INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_type),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fixed_leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT NOT NULL DEFAULT '',
  game_type TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  best_accuracy REAL NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_type, difficulty, question_count),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_point_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_user_id INTEGER NOT NULL,
  student_username TEXT NOT NULL,
  category TEXT NOT NULL,
  stars INTEGER NOT NULL,
  record_date TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_by_user_id INTEGER NOT NULL,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_student_point_records_student_date
ON student_point_records(student_user_id, record_date);

CREATE INDEX IF NOT EXISTS idx_student_point_records_date
ON student_point_records(record_date);

CREATE TABLE IF NOT EXISTS word_challenge_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_date TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  words_json TEXT NOT NULL,
  created_by_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_word_challenge_tasks_date
ON word_challenge_tasks(task_date);

CREATE TABLE IF NOT EXISTS word_challenge_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  student_user_id INTEGER NOT NULL,
  student_username TEXT NOT NULL,
  point_record_id INTEGER,
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, student_user_id),
  FOREIGN KEY(task_id) REFERENCES word_challenge_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY(student_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(point_record_id) REFERENCES student_point_records(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_word_challenge_completions_student
ON word_challenge_completions(student_user_id, completed_at);

CREATE TABLE IF NOT EXISTS english_reading_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_date TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL DEFAULT '',
  vocabulary_json TEXT NOT NULL,
  paragraphs_json TEXT NOT NULL,
  questions_json TEXT NOT NULL,
  created_by_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_english_reading_tasks_date
ON english_reading_tasks(task_date);

CREATE TABLE IF NOT EXISTS english_reading_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  student_user_id INTEGER NOT NULL,
  student_username TEXT NOT NULL,
  point_record_id INTEGER,
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, student_user_id),
  FOREIGN KEY(task_id) REFERENCES english_reading_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY(student_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(point_record_id) REFERENCES student_point_records(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_english_reading_completions_student
ON english_reading_completions(student_user_id, completed_at);
