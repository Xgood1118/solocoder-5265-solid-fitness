import { Component, createSignal, createEffect, For } from 'solid-js';
import { createResource } from 'solid-js';
import ExerciseCard from '../components/ExerciseCard';
import { api } from '../utils/api';
import type { Exercise } from '../types';

const Exercises: Component = () => {
  const [selectedMuscle, setSelectedMuscle] = createSignal<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = createSignal<string>('');
  const [searchQuery, setSearchQuery] = createSignal<string>('');

  const [muscles] = createResource(() => api.exercises.muscles(), { initialValue: [] as string[] });

  const [exercises, { refetch }] = createResource(
    () => ({
      muscle: selectedMuscle(),
      difficulty: selectedDifficulty(),
      search: searchQuery(),
      page_size: 100,
    }),
    (params) => api.exercises.list(params),
    { initialValue: [] as Exercise[] }
  );

  createEffect(() => {
    refetch();
  });

  return (
    <div>
      <div class="page-header">
        <h1 class="page-title">动作库</h1>
        <p class="page-subtitle">浏览所有训练动作，查看动作示范和要点</p>
      </div>

      <div class="card mb-8">
        <div style={{ display: 'grid', 'grid-template-columns': '2fr 1fr 1fr', gap: '12px' }}>
          <div class="form-group" style={{ margin: 0 }}>
            <label class="form-label">搜索</label>
            <input
              type="text"
              class="form-input"
              placeholder="搜索动作名称..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div class="form-group" style={{ margin: 0 }}>
            <label class="form-label">目标肌群</label>
            <select
              class="form-select"
              value={selectedMuscle()}
              onChange={(e) => setSelectedMuscle(e.target.value)}
            >
              <option value="">全部肌群</option>
              <For each={muscles()}>
                {(m) => <option value={m}>{m}</option>}
              </For>
            </select>
          </div>
          <div class="form-group" style={{ margin: 0 }}>
            <label class="form-label">难度</label>
            <select
              class="form-select"
              value={selectedDifficulty()}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="">全部难度</option>
              <option value="beginner">入门</option>
              <option value="intermediate">中级</option>
              <option value="advanced">高级</option>
            </select>
          </div>
        </div>
      </div>

      {exercises.loading && (
        <div style={{ 'text-align': 'center', padding: '40px', color: 'var(--text-muted)' }}>
          加载中...
        </div>
      )}

      {!exercises.loading && exercises().length === 0 && (
        <div style={{ 'text-align': 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <p>暂无匹配的动作</p>
        </div>
      )}

      {!exercises.loading && exercises().length > 0 && (
        <div class="grid grid-3">
          <For each={exercises()}>
            {(exercise) => <ExerciseCard exercise={exercise} />}
          </For>
        </div>
      )}

      <div style={{ 'margin-top': '16px', color: 'var(--text-muted)', 'font-size': '13px' }}>
        共 {exercises().length} 个动作
      </div>
    </div>
  );
};

export default Exercises;
