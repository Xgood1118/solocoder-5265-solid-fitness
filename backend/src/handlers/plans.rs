use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use sqlx::SqlitePool;
use crate::models::*;
use crate::services::PlanService;

pub async fn list_plans(
    State(pool): State<SqlitePool>,
) -> Result<Json<Vec<TrainingPlan>>, StatusCode> {
    let plans = sqlx::query_as::<_, TrainingPlan>(
        "SELECT * FROM training_plans ORDER BY created_at DESC"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to list plans: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(plans))
}

pub async fn get_plan(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<Json<PlanDetail>, StatusCode> {
    let plan = sqlx::query_as::<_, TrainingPlan>(
        "SELECT * FROM training_plans WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to get plan: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let plan = match plan {
        Some(p) => p,
        None => return Err(StatusCode::NOT_FOUND),
    };

    let days_sql = r#"
        SELECT
            pd.id, pd.plan_id, pd.training_day_id, pd.day_of_week, pd.order_index,
            td.name, td.description, td.target_muscles, td.created_at
        FROM plan_days pd
        JOIN training_days td ON td.id = pd.training_day_id
        WHERE pd.plan_id = ?
        ORDER BY pd.day_of_week, pd.order_index
    "#;

    let rows: Vec<PlanDayRow> = sqlx::query_as::<_, PlanDayRow>(days_sql)
        .bind(id)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get plan days: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let days: Vec<PlanDayWithDetail> = rows
        .into_iter()
        .map(|row| PlanDayWithDetail {
            plan_day: PlanDay {
                id: row.id,
                plan_id: row.plan_id,
                training_day_id: row.training_day_id,
                day_of_week: row.day_of_week,
                order_index: row.order_index,
            },
            training_day: TrainingDay {
                id: row.training_day_id,
                name: row.name,
                description: row.description,
                target_muscles: row.target_muscles,
                created_at: row.created_at,
            },
        })
        .collect();

    Ok(Json(PlanDetail { plan, days }))
}

#[derive(sqlx::FromRow)]
struct PlanDayRow {
    id: i64,
    plan_id: i64,
    training_day_id: i64,
    day_of_week: i32,
    order_index: i32,
    name: String,
    description: Option<String>,
    target_muscles: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn create_plan(
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateTrainingPlan>,
) -> Result<Json<TrainingPlan>, StatusCode> {
    let mut tx = pool.begin().await.map_err(|e| {
        tracing::error!("Failed to start transaction: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let result = sqlx::query(
        r#"
        INSERT INTO training_plans (name, description, start_date)
        VALUES (?, ?, ?)
        "#
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&payload.start_date)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!("Failed to create plan: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let plan_id = result.last_insert_rowid();

    for day in &payload.days {
        sqlx::query(
            r#"
            INSERT INTO plan_days (plan_id, training_day_id, day_of_week, order_index)
            VALUES (?, ?, ?, ?)
            "#
        )
        .bind(plan_id)
        .bind(day.training_day_id)
        .bind(day.day_of_week)
        .bind(day.order_index)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!("Failed to add plan day: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    }

    tx.commit().await.map_err(|e| {
        tracing::error!("Failed to commit transaction: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let plan = sqlx::query_as::<_, TrainingPlan>(
        "SELECT * FROM training_plans WHERE id = ?"
    )
    .bind(plan_id)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch created plan: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(plan))
}

pub async fn freeze_plan(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<StatusCode, StatusCode> {
    PlanService::freeze_plan(&pool, id).await.map_err(|e| {
        tracing::error!("Failed to freeze plan: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(StatusCode::OK)
}

pub async fn activate_plan(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<StatusCode, StatusCode> {
    PlanService::activate_plan(&pool, id).await.map_err(|e| {
        tracing::error!("Failed to activate plan: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(StatusCode::OK)
}

pub async fn delete_plan(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<StatusCode, StatusCode> {
    let result = sqlx::query("DELETE FROM training_plans WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete plan: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if result.rows_affected() == 0 {
        Err(StatusCode::NOT_FOUND)
    } else {
        Ok(StatusCode::NO_CONTENT)
    }
}

pub async fn list_training_days(
    State(pool): State<SqlitePool>,
) -> Result<Json<Vec<TrainingDay>>, StatusCode> {
    let days = sqlx::query_as::<_, TrainingDay>(
        "SELECT * FROM training_days ORDER BY name"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to list training days: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(days))
}

pub async fn get_training_day(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<Json<TrainingDayDetail>, StatusCode> {
    let day = sqlx::query_as::<_, TrainingDay>(
        "SELECT * FROM training_days WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to get training day: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let day = match day {
        Some(d) => d,
        None => return Err(StatusCode::NOT_FOUND),
    };

    let exercises = sqlx::query_as::<_, TrainingDayExerciseWithName>(
        r#"
        SELECT
            tde.id, tde.training_day_id, tde.exercise_id,
            e.name as exercise_name,
            tde.sets, tde.target_reps, tde.rest_seconds, tde.order_index
        FROM training_day_exercises tde
        JOIN exercises e ON e.id = tde.exercise_id
        WHERE tde.training_day_id = ?
        ORDER BY tde.order_index
        "#
    )
    .bind(id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to get training day exercises: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(TrainingDayDetail { day, exercises }))
}

pub async fn create_training_day(
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateTrainingDay>,
) -> Result<Json<TrainingDay>, StatusCode> {
    let mut tx = pool.begin().await.map_err(|e| {
        tracing::error!("Failed to start transaction: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let result = sqlx::query(
        r#"
        INSERT INTO training_days (name, description, target_muscles)
        VALUES (?, ?, ?)
        "#
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&payload.target_muscles)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!("Failed to create training day: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let day_id = result.last_insert_rowid();

    for ex in &payload.exercises {
        sqlx::query(
            r#"
            INSERT INTO training_day_exercises
                (training_day_id, exercise_id, sets, target_reps, rest_seconds, order_index)
            VALUES (?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(day_id)
        .bind(ex.exercise_id)
        .bind(ex.sets)
        .bind(ex.target_reps)
        .bind(ex.rest_seconds)
        .bind(ex.order_index)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!("Failed to add exercise to training day: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    }

    tx.commit().await.map_err(|e| {
        tracing::error!("Failed to commit transaction: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let day = sqlx::query_as::<_, TrainingDay>(
        "SELECT * FROM training_days WHERE id = ?"
    )
    .bind(day_id)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch created training day: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(day))
}

pub async fn delete_training_day(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<StatusCode, StatusCode> {
    let result = sqlx::query("DELETE FROM training_days WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete training day: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if result.rows_affected() == 0 {
        Err(StatusCode::NOT_FOUND)
    } else {
        Ok(StatusCode::NO_CONTENT)
    }
}
