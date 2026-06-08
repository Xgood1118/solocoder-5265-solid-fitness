export interface Exercise {
  id: number;
  name: string;
  primary_muscle: string;
  secondary_muscles?: string;
  equipment?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  video_url?: string;
  video_thumbnail?: string;
  steps?: string;
  tips?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingDay {
  id: number;
  name: string;
  description?: string;
  target_muscles?: string;
  created_at: string;
}

export interface TrainingDayExercise {
  id: number;
  training_day_id: number;
  exercise_id: number;
  exercise_name: string;
  sets: number;
  target_reps: number;
  rest_seconds: number;
  order_index: number;
}

export interface TrainingDayDetail {
  day: TrainingDay;
  exercises: TrainingDayExercise[];
}

export interface TrainingPlan {
  id: number;
  name: string;
  description?: string;
  is_active: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  frozen_at?: string;
}

export interface PlanDay {
  id: number;
  plan_id: number;
  training_day_id: number;
  day_of_week: number;
  order_index: number;
}

export interface PlanDayWithDetail {
  plan_day: PlanDay;
  training_day: TrainingDay;
}

export interface PlanDetail {
  plan: TrainingPlan;
  days: PlanDayWithDetail[];
}

export interface WorkoutSession {
  id: number;
  plan_id?: number;
  training_day_id?: number;
  session_date: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  total_volume: number;
  created_at: string;
}

export interface WorkoutSet {
  id: number;
  session_id: number;
  exercise_id: number;
  exercise_name: string;
  set_number: number;
  weight: number;
  reps: number;
  completed: number;
  is_pr: number;
  with_assistance: number;
  notes?: string;
  rest_seconds?: number;
}

export interface WorkoutSessionDetail {
  session: WorkoutSession;
  sets: WorkoutSet[];
}

export interface CreateWorkoutSet {
  exercise_id: number;
  set_number: number;
  weight: number;
  reps: number;
  completed?: boolean;
  with_assistance?: boolean;
  notes?: string;
  rest_seconds?: number;
}

export interface CreateWorkoutSession {
  plan_id?: number;
  training_day_id?: number;
  session_date: string;
  notes?: string;
  sets: CreateWorkoutSet[];
}

export interface BodyMeasurement {
  id: number;
  measure_date: string;
  weight?: number;
  body_fat?: number;
  is_fasting: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arm?: number;
  thigh?: number;
  calf?: number;
  notes?: string;
  created_at: string;
}

export interface PrRecord {
  exercise_id: number;
  exercise_name: string;
  max_weight: number;
  max_reps: number;
  max_volume_set_id: number;
  achieved_at: string;
}

export interface WeeklyVolume {
  week_start: string;
  week_end: string;
  total_volume: number;
  session_count: number;
}

export interface CalendarDay {
  date: string;
  has_workout: boolean;
  muscles: string[];
  session_id?: number;
}

export interface MuscleConflict {
  muscle: string;
  last_train_date: string;
  days_since: number;
  conflict: boolean;
}
