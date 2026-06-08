mod models;
mod db;
mod services;
mod handlers;

use axum::{
    routing::{get, post},
    Router,
};
use tower_http::cors::{CorsLayer, Any};
use std::net::SocketAddr;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "solid_fitness_backend=debug,tower_http=debug".into()),
        )
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://fitness.db?mode=rwc".to_string());

    let pool = db::init_db(&database_url).await?;
    tracing::info!("Database initialized");

    let app = Router::new()
        .route("/api/health", get(health_check))
        .route("/api/exercises", get(handlers::exercises::list_exercises).post(handlers::exercises::create_exercise))
        .route("/api/exercises/muscles", get(handlers::exercises::list_muscle_groups))
        .route("/api/exercises/:id", get(handlers::exercises::get_exercise).post(handlers::exercises::update_exercise).delete(handlers::exercises::delete_exercise))
        .route("/api/plans", get(handlers::plans::list_plans).post(handlers::plans::create_plan))
        .route("/api/plans/:id", get(handlers::plans::get_plan).delete(handlers::plans::delete_plan))
        .route("/api/plans/:id/freeze", post(handlers::plans::freeze_plan))
        .route("/api/plans/:id/activate", post(handlers::plans::activate_plan))
        .route("/api/training-days", get(handlers::plans::list_training_days).post(handlers::plans::create_training_day))
        .route("/api/training-days/:id", get(handlers::plans::get_training_day).delete(handlers::plans::delete_training_day))
        .route("/api/workouts", get(handlers::workouts::list_sessions).post(handlers::workouts::create_session))
        .route("/api/workouts/:id", get(handlers::workouts::get_session).delete(handlers::workouts::delete_session))
        .route("/api/measurements", get(handlers::measurements::list_measurements).post(handlers::measurements::create_measurement))
        .route("/api/measurements/:id", get(handlers::measurements::get_measurement).post(handlers::measurements::update_measurement).delete(handlers::measurements::delete_measurement))
        .route("/api/stats/prs", get(handlers::stats::get_prs))
        .route("/api/stats/prs/:id", get(handlers::stats::get_exercise_pr))
        .route("/api/stats/volume", get(handlers::stats::get_weekly_volume))
        .route("/api/stats/volume/:id", get(handlers::stats::get_exercise_volume))
        .route("/api/stats/calendar", get(handlers::stats::get_calendar))
        .route("/api/stats/muscle-conflict", get(handlers::stats::check_muscle_conflict))
        .with_state(pool)
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse::<u16>()?;

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Server listening on {}", addr);

    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}
