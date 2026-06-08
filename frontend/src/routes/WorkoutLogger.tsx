import { Component, createSignal, createEffect, For } from 'solid-js';
import { createResource } from 'solid-js';
import { useParams, A, useNavigate } from '@solidjs/router';
import { api } from '../utils/api';
import SetLogger, { SetData } from '../components/SetLogger';
import type { Exercise, WorkoutSessionDetail } from '../types';

const WorkoutLogger: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const isView = () => !!params.id && params.id !== 'new';
  const sessionId = () => isView() ? parseInt(params.id) : 0;

  const [sessionDate, setSessionDate] = createSignal(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = createSignal('');
  const [exerciseSets, setExerciseSets] = createSignal<{
    exerciseId: number;
    exerciseName: string;
    sets: SetData[];
  }[]>([]);
  const [selectedExercise, setSelectedExercise] = createSignal<number>(0);

  const [exercises] = createResource(
    () => api.exercises.list({ page_size: 100 }),
    { initialValue: [] as Exercise[] }
  );

  const [sessionDetail] = createResource(
    () => isView() ? sessionId() : null,
    (id) => api.workouts.get(id),
  );

  createEffect(() => {
    if (sessionDetail()) {
      const detail = sessionDetail() as WorkoutSessionDetail;
      setSessionDate(detail.session.session_date);
      setNotes(detail.session.notes || '');

      const grouped: Record<number, { exerciseId: number; exerciseName: string; sets: SetData[] }> = {};

      detail.sets.forEach(set => {
        if (!grouped[set.exercise_id]) {
          grouped[set.exercise_id] = {
            exerciseId: set.exercise_id,
            exerciseName: set.exercise_name,
            sets: [],
          };
        }
        grouped[set.exercise_id].sets.push({
          id: set.id,
          setNumber: set.set_number,
          weight: set.weight,
          reps: set.reps,
          completed: set.completed === 1,
          isPr: set.is_pr === 1,
          withAssistance: set.with_assistance === 1,
          restSeconds: set.rest_seconds,
        });
      });

      setExerciseSets(Object.values(grouped));
    }
  });

  const addExercise = () => {
    const exId = selectedExercise();
    if (!exId) return;

    const exercise = exercises().find(e => e.id === exId);
    if (!exercise) return;

    setExerciseSets([...exerciseSets(), {
      exerciseId: exId,
      exerciseName: exercise.name,
      sets: [{
        id: Date.now(),
        setNumber: 1,
        weight: 0,
        reps: 10,
        completed: false,
        restSeconds: 90,
      }],
    }]);

    setSelectedExercise(0);
  };

  const updateExerciseSets = (index: number, sets: SetData[]) => {
    const newSets = [...exerciseSets()];
    newSets[index] = { ...newSets[index], sets };
    setExerciseSets(newSets);
  };

  const removeExercise = (index: number) => {
    setExerciseSets(exerciseSets().filter((_, i) => i !== index));
  };

  const totalVolume = () => {
    return exerciseSets().reduce((total, ex) => {
      return total + ex.sets
        .filter(s => s.completed)
        .reduce((sum, s) => sum + s.weight * s.reps, 0);
    }, 0);
  };

  const totalSets = () => {
    return exerciseSets().reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);
  };

  const handleSave = async () => {
    if (exerciseSets().length === 0) {
      alert('请至少添加一个训练动作');
      return;
    }

    const allSets = exerciseSets().flatMap(ex =>
      ex.sets.map(s => ({
        exercise_id: ex.exerciseId,
        set_number: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        completed: s.completed,
        with_assistance: s.withAssistance,
        rest_seconds: s.restSeconds,
      }))
    );

    try {
      await api.workouts.create({
        session_date: sessionDate(),
        notes: notes() || undefined,
        sets: allSets as any,
      });

      navigate('/');
    } catch (err) {
      alert('保存失败：' + (err as Error).message);
    }
  };

  return (
    <div>
      <div style={{ 'margin-bottom': '20px' }}>
        <A href="/" style={{ color: 'var(--text-secondary)', 'font-size': '14px' }}>
          ← 返回日历
        </A>
      </div>

      <div class="page-header" style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'flex-end' }}>
        <div>
          <h1 class="page-title">{isView() ? '训练详情' : '开始训练'}</h1>
          <p class="page-subtitle">
            {isView() ? '查看本次训练的详细记录' : '记录你的训练数据，追踪进步'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', 'align-items': 'center' }}>
          <div style={{ 'text-align': 'right' }}>
            <div style={{ 'font-size': '20px', 'font-weight': '700', color: 'var(--primary-color)' }}>
              {totalVolume().toFixed(0)} <span style={{ 'font-size': '14px', 'font-weight': '400' }}>kg</span>
            </div>
            <div style={{ 'font-size': '12px', color: 'var(--text-secondary)' }}>总容量 · {totalSets()} 组</div>
          </div>
        </div>
      </div>

      <div class="card mb-8">
        <div style={{ display: 'grid', 'grid-template-columns': '200px 1fr', gap: '16px' }}>
          <div class="form-group" style={{ margin: 0 }}>
            <label class="form-label">训练日期</label>
            <input
              type="date"
              class="form-input"
              value={sessionDate()}
              onInput={(e) => setSessionDate(e.target.value)}
              disabled={isView()}
            />
          </div>
          <div class="form-group" style={{ margin: 0 }}>
            <label class="form-label">备注</label>
            <input
              type="text"
              class="form-input"
              placeholder="今天感觉怎么样？"
              value={notes()}
              onInput={(e) => setNotes(e.target.value)}
              disabled={isView()}
            />
          </div>
        </div>
      </div>

      {!isView() && (
        <div class="card mb-8">
          <div class="card-header">
            <h3 class="card-title">添加动作</h3>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              class="form-select"
              style={{ flex: 1 }}
              value={selectedExercise()}
              onChange={(e) => setSelectedExercise(parseInt(e.target.value))}
            >
              <option value={0}>选择动作...</option>
              <For each={exercises()}>
                {(ex) => (
                  <option value={ex.id}>{ex.name} - {ex.primary_muscle}</option>
                )}
              </For>
            </select>
            <button
              type="button"
              class="btn btn-primary"
              onClick={addExercise}
              disabled={!selectedExercise()}
            >
              添加
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px', 'margin-bottom': '24px' }}>
        <For each={exerciseSets()}>
          {(exGroup, index) => (
            <div>
              <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '8px' }}>
                <h3 style={{ 'font-size': '16px', 'font-weight': '600' }}>
                  {exGroup.exerciseName}
                </h3>
                {!isView() && (
                  <button
                    class="btn btn-secondary btn-sm"
                    onClick={() => removeExercise(index())}
                  >
                    移除动作
                  </button>
                )}
              </div>
              <SetLogger
                exerciseId={exGroup.exerciseId}
                exerciseName={exGroup.exerciseName}
                sets={exGroup.sets}
                onSetsChange={(sets) => updateExerciseSets(index(), sets)}
              />
            </div>
          )}
        </For>
      </div>

      {exerciseSets().length === 0 && (
        <div class="card" style={{ 'text-align': 'center', padding: '60px' }}>
          <p style={{ color: 'var(--text-muted)', 'margin-bottom': '16px' }}>还没有添加训练动作</p>
          <p style={{ color: 'var(--text-muted)', 'font-size': '13px' }}>从上方选择动作开始训练吧！</p>
        </div>
      )}

      {!isView() && exerciseSets().length > 0 && (
        <div style={{ display: 'flex', gap: '12px', 'justify-content': 'flex-end' }}>
          <A href="/" class="btn btn-secondary">取消</A>
          <button class="btn btn-primary btn-lg" onClick={handleSave}>
            保存训练记录
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkoutLogger;
