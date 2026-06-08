-- 001_init.sql
-- 动作库表
CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    primary_muscle TEXT NOT NULL,
    secondary_muscles TEXT,
    equipment TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    video_url TEXT,
    video_thumbnail TEXT,
    steps TEXT,
    tips TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON exercises(primary_muscle);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);

-- 训练日模板表
CREATE TABLE IF NOT EXISTS training_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    target_muscles TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 训练日-动作关联表
CREATE TABLE IF NOT EXISTS training_day_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    training_day_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    sets INTEGER NOT NULL DEFAULT 3,
    target_reps INTEGER NOT NULL DEFAULT 10,
    rest_seconds INTEGER NOT NULL DEFAULT 90,
    order_index INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (training_day_id) REFERENCES training_days(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

CREATE INDEX IF NOT EXISTS idx_tde_training_day ON training_day_exercises(training_day_id);

-- 训练计划表
CREATE TABLE IF NOT EXISTS training_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    frozen_at TIMESTAMP
);

-- 计划-训练日关联表
CREATE TABLE IF NOT EXISTS plan_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    training_day_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (training_day_id) REFERENCES training_days(id)
);

CREATE INDEX IF NOT EXISTS idx_plan_days_plan ON plan_days(plan_id);

-- 训练会话表
CREATE TABLE IF NOT EXISTS workout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER,
    training_day_id INTEGER,
    session_date DATE NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    notes TEXT,
    total_volume REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES training_plans(id),
    FOREIGN KEY (training_day_id) REFERENCES training_days(id)
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_plan ON workout_sessions(plan_id);

-- 训练组记录表（按组粒度存储）
CREATE TABLE IF NOT EXISTS workout_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    set_number INTEGER NOT NULL,
    weight REAL NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 1,
    is_pr INTEGER NOT NULL DEFAULT 0,
    with_assistance INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    rest_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

CREATE INDEX IF NOT EXISTS idx_workout_sets_session ON workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_is_pr ON workout_sets(is_pr);

-- 体测记录表
CREATE TABLE IF NOT EXISTS body_measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    measure_date DATE NOT NULL,
    weight REAL,
    body_fat REAL,
    is_fasting INTEGER NOT NULL DEFAULT 0,
    chest REAL,
    waist REAL,
    hips REAL,
    arm REAL,
    thigh REAL,
    calf REAL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON body_measurements(measure_date);
