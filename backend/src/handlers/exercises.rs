use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use sqlx::SqlitePool;
use crate::models::*;

#[derive(Debug, Deserialize)]
pub struct ExerciseQuery {
    pub muscle: Option<String>,
    pub difficulty: Option<String>,
    pub search: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

pub async fn list_exercises(
    State(pool): State<SqlitePool>,
    Query(params): Query<ExerciseQuery>,
) -> Result<Json<Vec<Exercise>>, StatusCode> {
    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(50);
    let offset = (page - 1) * page_size;

    let mut query = String::from("SELECT * FROM exercises WHERE 1=1");
    let mut args: Vec<String> = Vec::new();

    if let Some(muscle) = &params.muscle {
        query.push_str(" AND primary_muscle = ?");
        args.push(muscle.clone());
    }
    if let Some(difficulty) = &params.difficulty {
        query.push_str(" AND difficulty = ?");
        args.push(difficulty.clone());
    }
    if let Some(search) = &params.search {
        query.push_str(" AND (name LIKE ? OR primary_muscle LIKE ?)");
        args.push(format!("%{}%", search));
        args.push(format!("%{}%", search));
    }

    query.push_str(" ORDER BY name LIMIT ? OFFSET ?");

    let mut q = sqlx::query_as::<_, Exercise>(&query);
    for arg in &args {
        q = q.bind(arg);
    }
    q = q.bind(page_size).bind(offset);

    let exercises = q.fetch_all(&pool).await.map_err(|e| {
        tracing::error!("Failed to list exercises: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(exercises))
}

pub async fn get_exercise(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<Json<Exercise>, StatusCode> {
    let exercise = sqlx::query_as::<_, Exercise>("SELECT * FROM exercises WHERE id = ?")
        .bind(id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get exercise: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    match exercise {
        Some(ex) => Ok(Json(ex)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn create_exercise(
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateExercise>,
) -> Result<Json<Exercise>, StatusCode> {
    let result = sqlx::query(
        r#"
        INSERT INTO exercises (
            name, primary_muscle, secondary_muscles, equipment, difficulty,
            video_url, video_thumbnail, steps, tips
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&payload.name)
    .bind(&payload.primary_muscle)
    .bind(&payload.secondary_muscles)
    .bind(&payload.equipment)
    .bind(&payload.difficulty)
    .bind(&payload.video_url)
    .bind(&payload.video_thumbnail)
    .bind(&payload.steps)
    .bind(&payload.tips)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to create exercise: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let id = result.last_insert_rowid();

    let exercise = sqlx::query_as::<_, Exercise>("SELECT * FROM exercises WHERE id = ?")
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch created exercise: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(exercise))
}

pub async fn update_exercise(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdateExercise>,
) -> Result<Json<Exercise>, StatusCode> {
    let existing = sqlx::query_as::<_, Exercise>("SELECT * FROM exercises WHERE id = ?")
        .bind(id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get exercise: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if existing.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    let existing = existing.unwrap();

    let name = payload.name.unwrap_or(existing.name);
    let primary_muscle = payload.primary_muscle.unwrap_or(existing.primary_muscle);
    let secondary_muscles = payload.secondary_muscles.or(existing.secondary_muscles);
    let equipment = payload.equipment.or(existing.equipment);
    let difficulty = payload.difficulty.unwrap_or(existing.difficulty);
    let video_url = payload.video_url.or(existing.video_url);
    let video_thumbnail = payload.video_thumbnail.or(existing.video_thumbnail);
    let steps = payload.steps.or(existing.steps);
    let tips = payload.tips.or(existing.tips);

    sqlx::query(
        r#"
        UPDATE exercises SET
            name = ?,
            primary_muscle = ?,
            secondary_muscles = ?,
            equipment = ?,
            difficulty = ?,
            video_url = ?,
            video_thumbnail = ?,
            steps = ?,
            tips = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        "#
    )
    .bind(&name)
    .bind(&primary_muscle)
    .bind(&secondary_muscles)
    .bind(&equipment)
    .bind(&difficulty)
    .bind(&video_url)
    .bind(&video_thumbnail)
    .bind(&steps)
    .bind(&tips)
    .bind(id)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to update exercise: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let exercise = sqlx::query_as::<_, Exercise>("SELECT * FROM exercises WHERE id = ?")
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch updated exercise: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(exercise))
}

pub async fn delete_exercise(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<StatusCode, StatusCode> {
    let result = sqlx::query("DELETE FROM exercises WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete exercise: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if result.rows_affected() == 0 {
        Err(StatusCode::NOT_FOUND)
    } else {
        Ok(StatusCode::NO_CONTENT)
    }
}

pub async fn list_muscle_groups(
    State(pool): State<SqlitePool>,
) -> Result<Json<Vec<String>>, StatusCode> {
    let muscles: Vec<(String,)> = sqlx::query_as(
        "SELECT DISTINCT primary_muscle FROM exercises ORDER BY primary_muscle"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to list muscle groups: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(muscles.into_iter().map(|(m,)| m).collect()))
}
