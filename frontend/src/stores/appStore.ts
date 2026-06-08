import { createSignal, createResource } from 'solid-js';
import { api } from '../utils/api';
import type {
  Exercise,
  TrainingPlan,
  TrainingDay,
  WorkoutSession,
  BodyMeasurement,
  PrRecord,
  WeeklyVolume,
} from '../types';

export const [muscleGroups, { refetch: refetchMuscles }] = createResource(
  () => api.exercises.muscles(),
  { initialValue: [] as string[] }
);

export const [exercises, { refetch: refetchExercises }] = createResource(
  () => api.exercises.list({ page_size: 100 }),
  { initialValue: [] as Exercise[] }
);

export const [plans, { refetch: refetchPlans }] = createResource(
  () => api.plans.list(),
  { initialValue: [] as TrainingPlan[] }
);

export const [trainingDays, { refetch: refetchTrainingDays }] = createResource(
  () => api.trainingDays.list(),
  { initialValue: [] as TrainingDay[] }
);

export const [workouts, setWorkouts] = createSignal<WorkoutSession[]>([]);

export const [measurements, setMeasurements] = createSignal<BodyMeasurement[]>([]);

export const [prs, setPrs] = createSignal<PrRecord[]>([]);

export const [weeklyVolume, setWeeklyVolume] = createSignal<WeeklyVolume[]>([]);

export const [currentWorkout, setCurrentWorkout] = createSignal<{
  exerciseId: number;
  exerciseName: string;
  sets: { weight: number; reps: number; completed: boolean }[];
} | null>(null);

export const [restTimer, setRestTimer] = createSignal({
  active: false,
  duration: 90,
  remaining: 0,
});

let restTimerInterval: number | null = null;

export function startRestTimer(seconds: number) {
  stopRestTimer();
  setRestTimer({
    active: true,
    duration: seconds,
    remaining: seconds,
  });

  restTimerInterval = window.setInterval(() => {
    setRestTimer(prev => {
      if (prev.remaining <= 1) {
        if (restTimerInterval) {
          clearInterval(restTimerInterval);
          restTimerInterval = null;
        }
        return { ...prev, active: false, remaining: 0 };
      }
      return { ...prev, remaining: prev.remaining - 1 };
    });
  }, 1000);
}

export function stopRestTimer() {
  if (restTimerInterval) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
  }
  setRestTimer(prev => ({ ...prev, active: false, remaining: 0 }));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const difficultyMap: Record<string, { label: string; class: string }> = {
  beginner: { label: '入门', class: 'badge-primary' },
  intermediate: { label: '中级', class: 'badge-warning' },
  advanced: { label: '高级', class: 'badge-danger' },
};

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)} 吨`;
  }
  return `${volume.toFixed(0)} 公斤`;
}
