use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use sqlx::SqlitePool;
use crate::models::*;

#[derive(Debug, Deserialize)]
pub struct MeasurementQuery {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

pub async fn list_measurements(
    State(pool): State<SqlitePool>,
    Query(params): Query<MeasurementQuery>,
) -> Result<Json<Vec<BodyMeasurement>>, StatusCode> {
    let mut query = String::from("SELECT * FROM body_measurements WHERE 1=1");
    let mut args: Vec<String> = Vec::new();

    if let Some(start_date) = &params.start_date {
        query.push_str(" AND measure_date >= ?");
        args.push(start_date.clone());
    }
    if let Some(end_date) = &params.end_date {
        query.push_str(" AND measure_date <= ?");
        args.push(end_date.clone());
    }

    query.push_str(" ORDER BY measure_date DESC");

    let mut q = sqlx::query_as::<_, BodyMeasurement>(&query);
    for arg in &args {
        q = q.bind(arg);
    }

    let measurements = q.fetch_all(&pool).await.map_err(|e| {
        tracing::error!("Failed to list measurements: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(measurements))
}

pub async fn get_measurement(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<Json<BodyMeasurement>, StatusCode> {
    let measurement = sqlx::query_as::<_, BodyMeasurement>(
        "SELECT * FROM body_measurements WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to get measurement: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    match measurement {
        Some(m) => Ok(Json(m)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn create_measurement(
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateBodyMeasurement>,
) -> Result<Json<BodyMeasurement>, StatusCode> {
    let is_fasting = payload.is_fasting.unwrap_or(false) as i64;

    let result = sqlx::query(
        r#"
        INSERT INTO body_measurements
            (measure_date, weight, body_fat, is_fasting,
             chest, waist, hips, arm, thigh, calf, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&payload.measure_date)
    .bind(payload.weight)
    .bind(payload.body_fat)
    .bind(is_fasting)
    .bind(payload.chest)
    .bind(payload.waist)
    .bind(payload.hips)
    .bind(payload.arm)
    .bind(payload.thigh)
    .bind(payload.calf)
    .bind(&payload.notes)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to create measurement: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let id = result.last_insert_rowid();

    let measurement = sqlx::query_as::<_, BodyMeasurement>(
        "SELECT * FROM body_measurements WHERE id = ?"
    )
    .bind(id)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch created measurement: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(measurement))
}

pub async fn update_measurement(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
    Json(payload): Json<CreateBodyMeasurement>,
) -> Result<Json<BodyMeasurement>, StatusCode> {
    let existing = sqlx::query_as::<_, BodyMeasurement>(
        "SELECT * FROM body_measurements WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to get measurement: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    if existing.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    let is_fasting = payload.is_fasting.unwrap_or(false) as i64;

    sqlx::query(
        r#"
        UPDATE body_measurements SET
            measure_date = ?,
            weight = ?,
            body_fat = ?,
            is_fasting = ?,
            chest = ?,
            waist = ?,
            hips = ?,
            arm = ?,
            thigh = ?,
            calf = ?,
            notes = ?
        WHERE id = ?
        "#
    )
    .bind(&payload.measure_date)
    .bind(payload.weight)
    .bind(payload.body_fat)
    .bind(is_fasting)
    .bind(payload.chest)
    .bind(payload.waist)
    .bind(payload.hips)
    .bind(payload.arm)
    .bind(payload.thigh)
    .bind(payload.calf)
    .bind(&payload.notes)
    .bind(id)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to update measurement: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let measurement = sqlx::query_as::<_, BodyMeasurement>(
        "SELECT * FROM body_measurements WHERE id = ?"
    )
    .bind(id)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch updated measurement: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(measurement))
}

pub async fn delete_measurement(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<StatusCode, StatusCode> {
    let result = sqlx::query("DELETE FROM body_measurements WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete measurement: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if result.rows_affected() == 0 {
        Err(StatusCode::NOT_FOUND)
    } else {
        Ok(StatusCode::NO_CONTENT)
    }
}
