use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use sqlx::SqlitePool;
use crate::models::*;
use crate::services::{PrService, VolumeService, CalendarService};

#[derive(Debug, Deserialize)]
pub struct CalendarQuery {
    pub year: i32,
    pub month: u32,
}

#[derive(Debug, Deserialize)]
pub struct VolumeQuery {
    pub weeks: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct ConflictQuery {
    pub muscles: String,
    pub date: String,
}

pub async fn get_prs(
    State(pool): State<SqlitePool>,
) -> Result<Json<Vec<PrRecord>>, StatusCode> {
    let prs = PrService::get_all_prs(&pool).await.map_err(|e| {
        tracing::error!("Failed to get PRs: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(prs))
}

pub async fn get_exercise_pr(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<Json<Option<PrRecord>>, StatusCode> {
    let pr = PrService::calculate_exercise_pr(&pool, id).await.map_err(|e| {
        tracing::error!("Failed to get exercise PR: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(pr))
}

pub async fn get_weekly_volume(
    State(pool): State<SqlitePool>,
    Query(params): Query<VolumeQuery>,
) -> Result<Json<Vec<WeeklyVolume>>, StatusCode> {
    let weeks = params.weeks.unwrap_or(12);
    let volumes = VolumeService::get_weekly_volume(&pool, weeks).await.map_err(|e| {
        tracing::error!("Failed to get weekly volume: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(volumes))
}

pub async fn get_exercise_volume(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
    Query(params): Query<VolumeQuery>,
) -> Result<Json<Vec<WeeklyVolume>>, StatusCode> {
    let weeks = params.weeks.unwrap_or(12);
    let volumes = VolumeService::get_exercise_volume_by_week(&pool, id, weeks)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get exercise volume: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(volumes))
}

pub async fn get_calendar(
    State(pool): State<SqlitePool>,
    Query(params): Query<CalendarQuery>,
) -> Result<Json<Vec<CalendarDay>>, StatusCode> {
    let days = CalendarService::get_month_calendar(&pool, params.year, params.month)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get calendar: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(days))
}

pub async fn check_muscle_conflict(
    State(pool): State<SqlitePool>,
    Query(params): Query<ConflictQuery>,
) -> Result<Json<Vec<MuscleConflict>>, StatusCode> {
    let muscles: Vec<String> = params.muscles.split(',').map(|s| s.to_string()).collect();
    let target_date = match chrono::NaiveDate::parse_from_str(&params.date, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => return Err(StatusCode::BAD_REQUEST),
    };

    let conflicts = CalendarService::check_muscle_conflict(&pool, &muscles, target_date)
        .await
        .map_err(|e| {
            tracing::error!("Failed to check muscle conflict: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(conflicts))
}
