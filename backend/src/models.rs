use serde::{Deserialize, Serialize};
use chrono::{DateTime, NaiveDate, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Exercise {
    pub id: i64,
    pub name: String,
    pub primary_muscle: String,
    pub secondary_muscles: Option<String>,
    pub equipment: Option<String>,
    pub difficulty: String,
    pub video_url: Option<String>,
    pub video_thumbnail: Option<String>,
    pub steps: Option<String>,
    pub tips: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateExercise {
    pub name: String,
    pub primary_muscle: String,
    pub secondary_muscles: Option<String>,
    pub equipment: Option<String>,
    pub difficulty: String,
    pub video_url: Option<String>,
    pub video_thumbnail: Option<String>,
    pub steps: Option<String>,
    pub tips: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateExercise {
    pub name: Option<String>,
    pub primary_muscle: Option<String>,
    pub secondary_muscles: Option<String>,
    pub equipment: Option<String>,
    pub difficulty: Option<String>,
    pub video_url: Option<String>,
    pub video_thumbnail: Option<String>,
    pub steps: Option<String>,
    pub tips: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TrainingDay {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub target_muscles: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTrainingDay {
    pub name: String,
    pub description: Option<String>,
    pub target_muscles: Option<String>,
    pub exercises: Vec<TrainingDayExerciseInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainingDayExerciseInput {
    pub exercise_id: i64,
    pub sets: i32,
    pub target_reps: i32,
    pub rest_seconds: i32,
    pub order_index: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TrainingDayExercise {
    pub id: i64,
    pub training_day_id: i64,
    pub exercise_id: i64,
    pub sets: i32,
    pub target_reps: i32,
    pub rest_seconds: i32,
    pub order_index: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainingDayDetail {
    pub day: TrainingDay,
    pub exercises: Vec<TrainingDayExerciseWithName>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TrainingDayExerciseWithName {
    pub id: i64,
    pub training_day_id: i64,
    pub exercise_id: i64,
    pub exercise_name: String,
    pub sets: i32,
    pub target_reps: i32,
    pub rest_seconds: i32,
    pub order_index: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TrainingPlan {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub is_active: i64,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
    pub frozen_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTrainingPlan {
    pub name: String,
    pub description: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub days: Vec<PlanDayInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanDayInput {
    pub training_day_id: i64,
    pub day_of_week: i32,
    pub order_index: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PlanDay {
    pub id: i64,
    pub plan_id: i64,
    pub training_day_id: i64,
    pub day_of_week: i32,
    pub order_index: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanDetail {
    pub plan: TrainingPlan,
    pub days: Vec<PlanDayWithDetail>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanDayWithDetail {
    pub plan_day: PlanDay,
    pub training_day: TrainingDay,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WorkoutSession {
    pub id: i64,
    pub plan_id: Option<i64>,
    pub training_day_id: Option<i64>,
    pub session_date: NaiveDate,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub notes: Option<String>,
    pub total_volume: f64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWorkoutSession {
    pub plan_id: Option<i64>,
    pub training_day_id: Option<i64>,
    pub session_date: NaiveDate,
    pub notes: Option<String>,
    pub sets: Vec<CreateWorkoutSet>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WorkoutSet {
    pub id: i64,
    pub session_id: i64,
    pub exercise_id: i64,
    pub set_number: i32,
    pub weight: f64,
    pub reps: i32,
    pub completed: i64,
    pub is_pr: i64,
    pub with_assistance: i64,
    pub notes: Option<String>,
    pub rest_seconds: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWorkoutSet {
    pub exercise_id: i64,
    pub set_number: i32,
    pub weight: f64,
    pub reps: i32,
    pub completed: Option<bool>,
    pub with_assistance: Option<bool>,
    pub notes: Option<String>,
    pub rest_seconds: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkoutSessionDetail {
    pub session: WorkoutSession,
    pub sets: Vec<WorkoutSetWithExercise>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WorkoutSetWithExercise {
    pub id: i64,
    pub session_id: i64,
    pub exercise_id: i64,
    pub exercise_name: String,
    pub set_number: i32,
    pub weight: f64,
    pub reps: i32,
    pub completed: i64,
    pub is_pr: i64,
    pub with_assistance: i64,
    pub notes: Option<String>,
    pub rest_seconds: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct BodyMeasurement {
    pub id: i64,
    pub measure_date: NaiveDate,
    pub weight: Option<f64>,
    pub body_fat: Option<f64>,
    pub is_fasting: i64,
    pub chest: Option<f64>,
    pub waist: Option<f64>,
    pub hips: Option<f64>,
    pub arm: Option<f64>,
    pub thigh: Option<f64>,
    pub calf: Option<f64>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateBodyMeasurement {
    pub measure_date: NaiveDate,
    pub weight: Option<f64>,
    pub body_fat: Option<f64>,
    pub is_fasting: Option<bool>,
    pub chest: Option<f64>,
    pub waist: Option<f64>,
    pub hips: Option<f64>,
    pub arm: Option<f64>,
    pub thigh: Option<f64>,
    pub calf: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PrRecord {
    pub exercise_id: i64,
    pub exercise_name: String,
    pub max_weight: f64,
    pub max_reps: i32,
    pub max_volume_set_id: i64,
    pub achieved_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WeeklyVolume {
    pub week_start: NaiveDate,
    pub week_end: NaiveDate,
    pub total_volume: f64,
    pub session_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalendarDay {
    pub date: String,
    pub has_workout: bool,
    pub muscles: Vec<String>,
    pub session_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MuscleConflict {
    pub muscle: String,
    pub last_train_date: String,
    pub days_since: i64,
    pub conflict: bool,
}
