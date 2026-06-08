use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use sqlx::SqlitePool;
use crate::models::*;
use crate::services::PrService;

#[derive(Debug, Deserialize)]
pub struct SessionQuery {
    pub date: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub plan_id: Option<i64>,
}

pub async fn list_sessions(
    State(pool): State<SqlitePool>,
    Query(params): Query<SessionQuery>,
) -> Result<Json<Vec<WorkoutSession>>, StatusCode> {
    let mut query = String::from("SELECT * FROM workout_sessions WHERE 1=1");
    let mut args: Vec<String> = Vec::new();

    if let Some(date) = &params.date {
        query.push_str(" AND session_date = ?");
        args.push(date.clone());
    }
    if let Some(start_date) = &params.start_date {
        query.push_str(" AND session_date >= ?");
        args.push(start_date.clone());
    }
    if let Some(end_date) = &params.end_date {
        query.push_str(" AND session_date <= ?");
        args.push(end_date.clone());
    }
    if let Some(plan_id) = params.plan_id {
        query.push_str(" AND plan_id = ?");
        args.push(plan_id.to_string());
    }

    query.push_str(" ORDER BY session_date DESC, created_at DESC");

    let mut q = sqlx::query_as::<_, WorkoutSession>(&query);
    for arg in &args {
        q = q.bind(arg);
    }

    let sessions = q.fetch_all(&pool).await.map_err(|e| {
        tracing::error!("Failed to list sessions: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(sessions))
}

pub async fn get_session(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<Json<WorkoutSessionDetail>, StatusCode> {
    let session = sqlx::query_as::<_, WorkoutSession>(
        "SELECT * FROM workout_sessions WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to get session: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let session = match session {
        Some(s) => s,
        None => return Err(StatusCode::NOT_FOUND),
    };

    let sets = sqlx::query_as::<_, WorkoutSetWithExercise>(
        r#"
        SELECT
            ws.id, ws.session_id, ws.exercise_id,
            e.name as exercise_name,
            ws.set_number, ws.weight, ws.reps,
            ws.completed, ws.is_pr, ws.with_assistance,
            ws.notes, ws.rest_seconds, ws.created_at
        FROM workout_sets ws
        JOIN exercises e ON e.id = ws.exercise_id
        WHERE ws.session_id = ?
        ORDER BY ws.exercise_id, ws.set_number
        "#
    )
    .bind(id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to get session sets: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(WorkoutSessionDetail { session, sets }))
}

pub async fn create_session(
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateWorkoutSession>,
) -> Result<Json<WorkoutSessionDetail>, StatusCode> {
    let mut tx = pool.begin().await.map_err(|e| {
        tracing::error!("Failed to start transaction: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let result = sqlx::query(
        r#"
        INSERT INTO workout_sessions (plan_id, training_day_id, session_date, notes)
        VALUES (?, ?, ?, ?)
        "#
    )
    .bind(payload.plan_id)
    .bind(payload.training_day_id)
    .bind(&payload.session_date)
    .bind(&payload.notes)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!("Failed to create session: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let session_id = result.last_insert_rowid();
    let mut total_volume: f64 = 0.0;

    for set in &payload.sets {
        let completed = set.completed.unwrap_or(true) as i64;
        let with_assistance = set.with_assistance.unwrap_or(false) as i64;

        sqlx::query(
            r#"
            INSERT INTO workout_sets
                (session_id, exercise_id, set_number, weight, reps,
                 completed, is_pr, with_assistance, notes, rest_seconds)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
            "#
        )
        .bind(session_id)
        .bind(set.exercise_id)
        .bind(set.set_number)
        .bind(set.weight)
        .bind(set.reps)
        .bind(completed)
        .bind(with_assistance)
        .bind(&set.notes)
        .bind(set.rest_seconds)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!("Failed to add workout set: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

        if set.completed.unwrap_or(true) {
            total_volume += set.weight * set.reps as f64;
        }
    }

    let session_sets: Vec<(i64, i64, f64, i32, i64)> = sqlx::query_as(
        r#"
        SELECT
            id, exercise_id, weight, reps, with_assistance
        FROM workout_sets
        WHERE session_id = ?
          AND completed = 1
        ORDER BY exercise_id, weight DESC, reps DESC
        "#
    )
    .bind(session_id)
    .fetch_all(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!("Failed to get session sets for PR calc: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    fn weight_key(w: f64) -> i64 {
        (w * 100.0).round() as i64
    }

    let mut last_key: Option<(i64, i64)> = None;
    for (set_id, exercise_id, weight, reps, with_assistance) in session_sets {
        let key = (exercise_id, weight_key(weight));
        if Some(key) == last_key {
            continue;
        }
        last_key = Some(key);

        let is_pr = PrService::check_if_new_pr(
            &pool,
            exercise_id,
            weight,
            reps,
            with_assistance == 1,
        )
        .await
        .unwrap_or(false);

        if is_pr {
            sqlx::query("UPDATE workout_sets SET is_pr = 1 WHERE id = ?")
                .bind(set_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to update PR flag: {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
        }
    }

    sqlx::query(
        "UPDATE workout_sessions SET total_volume = ? WHERE id = ?"
    )
    .bind(total_volume)
    .bind(session_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!("Failed to update session volume: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    tx.commit().await.map_err(|e| {
        tracing::error!("Failed to commit transaction: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let session = sqlx::query_as::<_, WorkoutSession>(
        "SELECT * FROM workout_sessions WHERE id = ?"
    )
    .bind(session_id)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch created session: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let sets = sqlx::query_as::<_, WorkoutSetWithExercise>(
        r#"
        SELECT
            ws.id, ws.session_id, ws.exercise_id,
            e.name as exercise_name,
            ws.set_number, ws.weight, ws.reps,
            ws.completed, ws.is_pr, ws.with_assistance,
            ws.notes, ws.rest_seconds, ws.created_at
        FROM workout_sets ws
        JOIN exercises e ON e.id = ws.exercise_id
        WHERE ws.session_id = ?
        ORDER BY ws.exercise_id, ws.set_number
        "#
    )
    .bind(session_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch session sets: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(WorkoutSessionDetail { session, sets }))
}

pub async fn delete_session(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<StatusCode, StatusCode> {
    let result = sqlx::query("DELETE FROM workout_sessions WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete session: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if result.rows_affected() == 0 {
        Err(StatusCode::NOT_FOUND)
    } else {
        Ok(StatusCode::NO_CONTENT)
    }
}
