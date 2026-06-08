use crate::models::*;
use sqlx::SqlitePool;
use anyhow::Result;
use chrono::{Duration, NaiveDate};

pub struct PrService;

impl PrService {
    pub async fn calculate_exercise_pr(
        pool: &SqlitePool,
        exercise_id: i64,
    ) -> Result<Option<PrRecord>> {
        let record = sqlx::query_as::<_, PrRecord>(
            r#"
            SELECT
                ws.exercise_id,
                e.name as exercise_name,
                ws.weight as max_weight,
                ws.reps as max_reps,
                ws.id as max_volume_set_id,
                ws.created_at as achieved_at
            FROM workout_sets ws
            JOIN exercises e ON e.id = ws.exercise_id
            WHERE ws.exercise_id = ?
                AND ws.completed = 1
                AND ws.with_assistance = 0
            ORDER BY ws.weight DESC, ws.reps DESC, ws.created_at DESC
            LIMIT 1
            "#
        )
        .bind(exercise_id)
        .fetch_optional(pool)
        .await?;

        Ok(record)
    }

    pub async fn get_all_prs(pool: &SqlitePool) -> Result<Vec<PrRecord>> {
        let exercises: Vec<(i64,)> = sqlx::query_as(
            "SELECT DISTINCT exercise_id FROM workout_sets WHERE completed = 1 AND with_assistance = 0"
        )
        .fetch_all(pool)
        .await?;

        let mut prs = Vec::new();
        for (exercise_id,) in exercises {
            if let Some(pr) = Self::calculate_exercise_pr(pool, exercise_id).await? {
                prs.push(pr);
            }
        }

        prs.sort_by(|a, b| b.max_weight.partial_cmp(&a.max_weight).unwrap_or(std::cmp::Ordering::Equal));
        Ok(prs)
    }

    pub async fn check_if_new_pr(
        pool: &SqlitePool,
        exercise_id: i64,
        weight: f64,
        reps: i32,
        with_assistance: bool,
    ) -> Result<bool> {
        if with_assistance || weight <= 0.0 {
            return Ok(false);
        }

        let current_pr: Option<(f64, i32)> = sqlx::query_as(
            r#"
            SELECT weight, reps
            FROM workout_sets
            WHERE exercise_id = ?
                AND completed = 1
                AND with_assistance = 0
            ORDER BY weight DESC, reps DESC
            LIMIT 1
            "#
        )
        .bind(exercise_id)
        .fetch_optional(pool)
        .await?;

        match current_pr {
            Some((best_weight, best_reps)) => {
                if weight > best_weight {
                    return Ok(true);
                }
                if (weight - best_weight).abs() < f64::EPSILON && reps > best_reps {
                    return Ok(true);
                }
                Ok(false)
            }
            None => Ok(true),
        }
    }
}

pub struct VolumeService;

impl VolumeService {
    pub async fn get_weekly_volume(
        pool: &SqlitePool,
        weeks: i32,
    ) -> Result<Vec<WeeklyVolume>> {
        let today = chrono::Local::now().date_naive();
        let week_start = today - Duration::days((weeks * 7) as i64);

        let records = sqlx::query_as::<_, WeeklyVolume>(
            r#"
            SELECT
                DATE(ws.session_date, 'weekday 1', '-6 days') as week_start,
                DATE(ws.session_date, 'weekday 1', '0 days') as week_end,
                COALESCE(SUM(ws.total_volume), 0) as total_volume,
                COUNT(DISTINCT ws.id) as session_count
            FROM workout_sessions ws
            WHERE ws.session_date >= ?
            GROUP BY week_start
            ORDER BY week_start ASC
            "#
        )
        .bind(week_start)
        .fetch_all(pool)
        .await?;

        Ok(records)
    }

    pub async fn get_exercise_volume_by_week(
        pool: &SqlitePool,
        exercise_id: i64,
        weeks: i32,
    ) -> Result<Vec<WeeklyVolume>> {
        let today = chrono::Local::now().date_naive();
        let start_date = today - Duration::days((weeks * 7) as i64);

        let records = sqlx::query_as::<_, WeeklyVolume>(
            r#"
            SELECT
                DATE(s.session_date, 'weekday 1', '-6 days') as week_start,
                DATE(s.session_date, 'weekday 1', '0 days') as week_end,
                COALESCE(SUM(w.weight * w.reps), 0) as total_volume,
                COUNT(DISTINCT s.id) as session_count
            FROM workout_sets w
            JOIN workout_sessions s ON s.id = w.session_id
            WHERE w.exercise_id = ?
                AND s.session_date >= ?
                AND w.completed = 1
            GROUP BY week_start
            ORDER BY week_start ASC
            "#
        )
        .bind(exercise_id)
        .bind(start_date)
        .fetch_all(pool)
        .await?;

        Ok(records)
    }

    pub fn calculate_set_volume(sets: &[WorkoutSet]) -> f64 {
        if sets.is_empty() {
            return 0.0;
        }
        sets.iter()
            .filter(|s| s.completed == 1)
            .map(|s| s.weight * s.reps as f64)
            .sum()
    }
}

pub struct CalendarService;

impl CalendarService {
    pub async fn get_month_calendar(
        pool: &SqlitePool,
        year: i32,
        month: u32,
    ) -> Result<Vec<CalendarDay>> {
        let start = NaiveDate::from_ymd_opt(year, month, 1).unwrap();
        let end = if month == 12 {
            NaiveDate::from_ymd_opt(year + 1, 1, 1).unwrap()
        } else {
            NaiveDate::from_ymd_opt(year, month + 1, 1).unwrap()
        } - Duration::days(1);

        let sessions: Vec<CalendarSessionRow> = sqlx::query_as(
            r#"
            SELECT
                ws.id,
                ws.session_date,
                GROUP_CONCAT(DISTINCT e.primary_muscle) as muscles
            FROM workout_sessions ws
            LEFT JOIN workout_sets wset ON wset.session_id = ws.id
            LEFT JOIN exercises e ON e.id = wset.exercise_id
            WHERE ws.session_date BETWEEN ? AND ?
            GROUP BY ws.id, ws.session_date
            "#
        )
        .bind(start)
        .bind(end)
        .fetch_all(pool)
        .await?;

        let mut days = Vec::new();
        let mut current = start;
        while current <= end {
            let date_str = current.format("%Y-%m-%d").to_string();
            let session = sessions.iter().find(|s| s.session_date == date_str);
            let day = CalendarDay {
                date: date_str,
                has_workout: session.is_some(),
                muscles: session
                    .and_then(|s| s.muscles.as_ref())
                    .map(|m| m.split(',').map(|s| s.to_string()).collect())
                    .unwrap_or_default(),
                session_id: session.map(|s| s.id),
            };
            days.push(day);
            current += Duration::days(1);
        }

        Ok(days)
    }

    pub async fn check_muscle_conflict(
        pool: &SqlitePool,
        muscles: &[String],
        target_date: NaiveDate,
    ) -> Result<Vec<MuscleConflict>> {
        let two_days_ago = target_date - Duration::days(2);
        let mut conflicts = Vec::new();

        for muscle in muscles {
            let result: Option<(Option<String>, Option<i64>)> = sqlx::query_as(
                r#"
                SELECT
                    MAX(ws.session_date) as last_train_date,
                    CAST(julianday(?) - julianday(MAX(ws.session_date)) AS INTEGER) as days_since
                FROM workout_sessions ws
                JOIN workout_sets wset ON wset.session_id = ws.id
                JOIN exercises e ON e.id = wset.exercise_id
                WHERE e.primary_muscle = ?
                    AND ws.session_date >= ?
                    AND ws.session_date <= ?
                "#
            )
            .bind(target_date.format("%Y-%m-%d").to_string())
            .bind(muscle)
            .bind(two_days_ago.format("%Y-%m-%d").to_string())
            .bind(target_date.format("%Y-%m-%d").to_string())
            .fetch_optional(pool)
            .await?;

            if let Some((last_date_opt, days_since_opt)) = result {
                if let Some(last_date_str) = last_date_opt {
                    let days_since = days_since_opt.unwrap_or(0);
                    conflicts.push(MuscleConflict {
                        muscle: muscle.clone(),
                        last_train_date: last_date_str,
                        days_since,
                        conflict: days_since < 3,
                    });
                } else {
                    conflicts.push(MuscleConflict {
                        muscle: muscle.clone(),
                        last_train_date: "".to_string(),
                        days_since: 999,
                        conflict: false,
                    });
                }
            }
        }

        Ok(conflicts)
    }
}

#[derive(sqlx::FromRow)]
struct CalendarSessionRow {
    id: i64,
    session_date: String,
    muscles: Option<String>,
}

pub struct PlanService;

impl PlanService {
    pub async fn freeze_plan(pool: &SqlitePool, plan_id: i64) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE training_plans
            SET is_active = 0,
                frozen_at = CURRENT_TIMESTAMP,
                end_date = DATE('now')
            WHERE id = ?
            "#
        )
        .bind(plan_id)
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn activate_plan(pool: &SqlitePool, plan_id: i64) -> Result<()> {
        sqlx::query("UPDATE training_plans SET is_active = 0 WHERE is_active = 1")
            .execute(pool)
            .await?;

        sqlx::query(
            r#"
            UPDATE training_plans
            SET is_active = 1,
                start_date = DATE('now')
            WHERE id = ?
            "#
        )
        .bind(plan_id)
        .execute(pool)
        .await?;

        Ok(())
    }
}
