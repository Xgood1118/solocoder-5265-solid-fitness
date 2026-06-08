import type {
  Exercise,
  TrainingPlan,
  PlanDetail,
  TrainingDay,
  TrainingDayDetail,
  WorkoutSession,
  WorkoutSessionDetail,
  CreateWorkoutSession,
  BodyMeasurement,
  CreateBodyMeasurement,
  PrRecord,
  WeeklyVolume,
  CalendarDay,
  MuscleConflict,
  CreateTrainingPlan,
  CreateTrainingDay,
} from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed: ${res.status} ${text}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const api = {
  exercises: {
    list: (params?: { muscle?: string; difficulty?: string; search?: string; page?: number; page_size?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.muscle) searchParams.set('muscle', params.muscle);
      if (params?.difficulty) searchParams.set('difficulty', params.difficulty);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.page_size) searchParams.set('page_size', String(params.page_size));
      const query = searchParams.toString();
      return request<Exercise[]>(`/exercises${query ? `?${query}` : ''}`);
    },
    get: (id: number) => request<Exercise>(`/exercises/${id}`),
    muscles: () => request<string[]>(`/exercises/muscles`),
    create: (data: Partial<Exercise>) =>
      request<Exercise>('/exercises', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Exercise>) =>
      request<Exercise>(`/exercises/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<void>(`/exercises/${id}`, { method: 'DELETE' }),
  },

  plans: {
    list: () => request<TrainingPlan[]>('/plans'),
    get: (id: number) => request<PlanDetail>(`/plans/${id}`),
    create: (data: CreateTrainingPlan) =>
      request<TrainingPlan>('/plans', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<void>(`/plans/${id}`, { method: 'DELETE' }),
    freeze: (id: number) =>
      request<void>(`/plans/${id}/freeze`, { method: 'POST' }),
    activate: (id: number) =>
      request<void>(`/plans/${id}/activate`, { method: 'POST' }),
  },

  trainingDays: {
    list: () => request<TrainingDay[]>('/training-days'),
    get: (id: number) => request<TrainingDayDetail>(`/training-days/${id}`),
    create: (data: CreateTrainingDay) =>
      request<TrainingDay>('/training-days', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<void>(`/training-days/${id}`, { method: 'DELETE' }),
  },

  workouts: {
    list: (params?: { date?: string; start_date?: string; end_date?: string; plan_id?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.date) searchParams.set('date', params.date);
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);
      if (params?.plan_id) searchParams.set('plan_id', String(params.plan_id));
      const query = searchParams.toString();
      return request<WorkoutSession[]>(`/workouts${query ? `?${query}` : ''}`);
    },
    get: (id: number) => request<WorkoutSessionDetail>(`/workouts/${id}`),
    create: (data: CreateWorkoutSession) =>
      request<WorkoutSessionDetail>('/workouts', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<void>(`/workouts/${id}`, { method: 'DELETE' }),
  },

  measurements: {
    list: (params?: { start_date?: string; end_date?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);
      const query = searchParams.toString();
      return request<BodyMeasurement[]>(`/measurements${query ? `?${query}` : ''}`);
    },
    get: (id: number) => request<BodyMeasurement>(`/measurements/${id}`),
    create: (data: CreateBodyMeasurement) =>
      request<BodyMeasurement>('/measurements', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: CreateBodyMeasurement) =>
      request<BodyMeasurement>(`/measurements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<void>(`/measurements/${id}`, { method: 'DELETE' }),
  },

  stats: {
    prs: () => request<PrRecord[]>('/stats/prs'),
    exercisePr: (id: number) => request<PrRecord | null>(`/stats/prs/${id}`),
    weeklyVolume: (weeks?: number) => {
      const query = weeks ? `?weeks=${weeks}` : '';
      return request<WeeklyVolume[]>(`/stats/volume${query}`);
    },
    exerciseVolume: (id: number, weeks?: number) => {
      const query = weeks ? `?weeks=${weeks}` : '';
      return request<WeeklyVolume[]>(`/stats/volume/${id}${query}`);
    },
    calendar: (year: number, month: number) =>
      request<CalendarDay[]>(`/stats/calendar?year=${year}&month=${month}`),
    muscleConflict: (muscles: string[], date: string) =>
      request<MuscleConflict[]>(
        `/stats/muscle-conflict?muscles=${muscles.join(',')}&date=${date}`
      ),
  },

  health: () => request<string>('/health'),
};
