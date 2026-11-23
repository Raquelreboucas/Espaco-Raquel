-- Meu Espaço Pessoal: esquema do banco (SQLite / libSQL)
-- Convenções: ids são texto (gerados no cliente) e únicos por usuário; "position" preserva a
-- ordem da lista; booleanos são 0/1; datas são texto ISO (AAAA-MM-DD; prazos AAAA-MM).
-- Toda tabela de dados tem user_id: cada pessoa só enxerga o que é dela.

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,            -- sempre minúsculo
  name          TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,                   -- scrypt$salt$hash
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,                   -- sha256 do token do cookie
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL                    -- epoch em segundos
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS login_attempts (      -- limite de tentativas erradas
  email TEXT NOT NULL,
  at    INTEGER NOT NULL                         -- epoch em segundos
);
CREATE INDEX IF NOT EXISTS idx_login_attempts ON login_attempts(email, at);

CREATE TABLE IF NOT EXISTS meta (                -- seção já gravada alguma vez?
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key     TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);

-- ---------- Wishlists ----------
CREATE TABLE IF NOT EXISTS wishlist_categories (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id       TEXT NOT NULL,
  name     TEXT NOT NULL,
  tone     TEXT NOT NULL DEFAULT 'mint' CHECK (tone IN ('mint','peach','pink','yellow','neutral')),
  note     TEXT NOT NULL DEFAULT '',
  box      INTEGER NOT NULL DEFAULT 0 CHECK (box IN (0,1)),   -- a categoria tem caixinha?
  position INTEGER NOT NULL,
  PRIMARY KEY (user_id, id)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id          TEXT NOT NULL,
  category_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  brand       TEXT NOT NULL DEFAULT '',
  room        TEXT NOT NULL DEFAULT '',
  price       REAL CHECK (price IS NULL OR price >= 0),
  link        TEXT NOT NULL DEFAULT '',
  img         TEXT NOT NULL DEFAULT '',          -- data URL (foto reduzida no cliente)
  priority    TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('alta','media','baixa')),
  note        TEXT NOT NULL DEFAULT '',
  done        INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0,1)),
  use_box     INTEGER NOT NULL DEFAULT 1 CHECK (use_box IN (0,1)), -- usa a caixinha da categoria?
  position    INTEGER NOT NULL,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, category_id) REFERENCES wishlist_categories(user_id, id)
);

CREATE TABLE IF NOT EXISTS wishlist_deposits (   -- caixinha: dinheiro juntado para os itens da categoria
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id          TEXT NOT NULL,
  category_id TEXT NOT NULL,
  date        TEXT NOT NULL,
  amount      REAL NOT NULL CHECK (amount > 0),
  note        TEXT NOT NULL DEFAULT '',
  position    INTEGER NOT NULL,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, category_id) REFERENCES wishlist_categories(user_id, id)
);

CREATE TABLE IF NOT EXISTS wishlist_seeds (      -- cargas/migrações já aplicadas
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seed    TEXT NOT NULL,
  PRIMARY KEY (user_id, seed)
);

-- ---------- Objetivos ----------
CREATE TABLE IF NOT EXISTS goal_areas (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id       TEXT NOT NULL,
  name     TEXT NOT NULL,
  tone     TEXT NOT NULL DEFAULT 'mint' CHECK (tone IN ('mint','peach','pink','yellow','neutral')),
  position INTEGER NOT NULL,
  PRIMARY KEY (user_id, id)
);

CREATE TABLE IF NOT EXISTS goals (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id       TEXT NOT NULL,
  area_id  TEXT NOT NULL,
  title    TEXT NOT NULL,
  due      TEXT NOT NULL DEFAULT '',
  done     INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0,1)),
  position INTEGER NOT NULL,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, area_id) REFERENCES goal_areas(user_id, id)
);

CREATE TABLE IF NOT EXISTS goal_steps (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id       TEXT NOT NULL,
  goal_id  TEXT NOT NULL,
  text     TEXT NOT NULL,
  done     INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0,1)),
  position INTEGER NOT NULL,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, goal_id) REFERENCES goals(user_id, id)
);

-- ---------- Planner semanal ----------
CREATE TABLE IF NOT EXISTS planner_tasks (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id       TEXT NOT NULL,
  date     TEXT NOT NULL,
  text     TEXT NOT NULL,
  done     INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0,1)),
  position INTEGER NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_date ON planner_tasks(user_id, date);

CREATE TABLE IF NOT EXISTS planner_focus (       -- "foco da semana", chave = segunda-feira
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  text       TEXT NOT NULL,
  PRIMARY KEY (user_id, week_start)
);

-- ---------- Concursos (TJSP, Receita Federal, INSS...) ----------
CREATE TABLE IF NOT EXISTS study_exams (
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id           TEXT NOT NULL,
  name         TEXT NOT NULL,
  exam_date    TEXT NOT NULL DEFAULT '',
  weekly_hours REAL NOT NULL DEFAULT 10 CHECK (weekly_hours >= 0),
  position     INTEGER NOT NULL,
  PRIMARY KEY (user_id, id)
);

CREATE TABLE IF NOT EXISTS study_subjects (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id       TEXT NOT NULL,
  exam_id  TEXT NOT NULL,
  name     TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, exam_id) REFERENCES study_exams(user_id, id)
);

CREATE TABLE IF NOT EXISTS study_topics (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id         TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  text       TEXT NOT NULL,
  done       INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0,1)),
  position   INTEGER NOT NULL,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, subject_id) REFERENCES study_subjects(user_id, id)
);

CREATE TABLE IF NOT EXISTS study_log (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id       TEXT NOT NULL,
  exam_id  TEXT NOT NULL,
  date     TEXT NOT NULL,
  subject  TEXT NOT NULL DEFAULT '',             -- nome da matéria ('' = Geral)
  minutes  INTEGER NOT NULL CHECK (minutes > 0 AND minutes <= 1440),
  position INTEGER NOT NULL,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, exam_id) REFERENCES study_exams(user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_study_log_date ON study_log(user_id, date);

-- ---------- Painel TJSP (edital completo, tópicos estudados e baterias de questões) ----------
CREATE TABLE IF NOT EXISTS tjsp_topics (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_key   TEXT NOT NULL,                       -- ex.: "pen-0" (matéria-posição no edital)
  studied_on  TEXT NOT NULL,
  reviewed_on TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (user_id, topic_key)
);
CREATE TABLE IF NOT EXISTS tjsp_questions (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id       TEXT NOT NULL,
  subject  TEXT NOT NULL,
  topic    INTEGER,                                -- posição do tópico na matéria (vazio = vários tópicos)
  date     TEXT NOT NULL,
  total    INTEGER NOT NULL CHECK (total > 0),
  hits     INTEGER NOT NULL CHECK (hits >= 0 AND hits <= total),
  note     TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE TABLE IF NOT EXISTS tjsp_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  goal    INTEGER NOT NULL DEFAULT 80 CHECK (goal BETWEEN 0 AND 100)
);
