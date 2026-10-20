import type { DatabaseSync } from "node:sqlite";

export type Migration = {
  version: number;
  name: string;
  sql: string;
};

export const migrations: Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL UNIQUE,
        name TEXT,
        grade_level INTEGER,
        field TEXT,
        grade_scale REAL NOT NULL DEFAULT 20,
        daily_goal_minutes INTEGER NOT NULL DEFAULT 90,
        onboarded_at TEXT,
        is_demo INTEGER NOT NULL DEFAULT 0,
        notification_enabled INTEGER NOT NULL DEFAULT 0,
        reminder_lead_minutes INTEGER NOT NULL DEFAULT 15,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        user_agent TEXT,
        created_at TEXT NOT NULL,
        last_used_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

      CREATE TABLE IF NOT EXISTS otp_challenges (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT NOT NULL,
        consumed_at TEXT,
        created_at TEXT NOT NULL,
        ip_hash TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_otp_phone_created ON otp_challenges(phone, created_at DESC);

      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        window_start TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        blocked_until TEXT
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'violet',
        icon TEXT NOT NULL DEFAULT 'book-open',
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, name)
      );
      CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id, is_archived);

      CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
        title TEXT NOT NULL,
        exam_date TEXT NOT NULL,
        grade REAL,
        max_grade REAL NOT NULL,
        weight REAL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_exams_user_date ON exams(user_id, exam_date);
      CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject_id);

      CREATE TABLE IF NOT EXISTS daily_reports (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        report_date TEXT NOT NULL,
        entry_index INTEGER NOT NULL DEFAULT 0,
        lessons_reviewed TEXT,
        exercises TEXT,
        difficulties TEXT,
        reflection TEXT,
        next_day_goals TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, report_date, entry_index)
      );
      CREATE INDEX IF NOT EXISTS idx_reports_user_date ON daily_reports(user_id, report_date DESC);

      CREATE TABLE IF NOT EXISTS report_subjects (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
        subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
        minutes INTEGER NOT NULL DEFAULT 0,
        note TEXT,
        UNIQUE(report_id, subject_id)
      );
      CREATE INDEX IF NOT EXISTS idx_report_subjects_subject ON report_subjects(subject_id);

      CREATE TABLE IF NOT EXISTS report_tasks (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
        subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed','pending')),
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_report_tasks_report ON report_tasks(report_id);

      CREATE TABLE IF NOT EXISTS study_series (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'study',
        priority TEXT NOT NULL DEFAULT 'medium',
        notes TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        weekdays TEXT NOT NULL,
        start_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        reminder_minutes INTEGER NOT NULL DEFAULT 15,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_series_user ON study_series(user_id);

      CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
        series_id TEXT REFERENCES study_series(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'study',
        priority TEXT NOT NULL DEFAULT 'medium',
        notes TEXT,
        session_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','completed')),
        reminder_minutes INTEGER NOT NULL DEFAULT 15,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, session_date);
      CREATE INDEX IF NOT EXISTS idx_sessions_series ON study_sessions(series_id);

      CREATE TABLE IF NOT EXISTS study_goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        metric TEXT NOT NULL CHECK (metric IN ('study-minutes','tasks-completed','exam-average')),
        period TEXT NOT NULL CHECK (period IN ('daily','weekly','monthly')),
        target_value REAL NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_goals_user ON study_goals(user_id, is_active);

      CREATE TABLE IF NOT EXISTS report_cards (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        card_type TEXT NOT NULL CHECK (card_type IN ('weekly','monthly')),
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        data_json TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        generated_at TEXT NOT NULL,
        UNIQUE(user_id, card_type, period_start)
      );
      CREATE INDEX IF NOT EXISTS idx_cards_user_period ON report_cards(user_id, card_type, period_start DESC);
    `,
  },
];

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
  for (const migration of migrations) {
    const applied = db
      .prepare("SELECT version FROM schema_migrations WHERE version = ?")
      .get(migration.version);
    if (applied) continue;
    db.exec("BEGIN");
    try {
      db.exec(migration.sql);
      db.prepare(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
      ).run(migration.version, migration.name, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}
