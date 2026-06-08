import { Component, createResource } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { api } from '../utils/api';
import { difficultyMap, formatDate } from '../stores/appStore';
import type { Exercise, PrRecord, WeeklyVolume } from '../types';
import VolumeChart from '../components/VolumeChart';

const ExerciseDetail: Component = () => {
  const params = useParams();
  const id = () => parseInt(params.id);

  const [exercise] = createResource(
    () => id(),
    (id) => api.exercises.get(id),
  );

  const [pr] = createResource(
    () => id(),
    (id) => api.stats.exercisePr(id),
  );

  const [volumeData] = createResource(
    () => id(),
    (id) => api.stats.exerciseVolume(id, 12),
    { initialValue: [] as WeeklyVolume[] }
  );

  const diff = () => {
    if (!exercise()) return { label: '', class: '' };
    return difficultyMap[exercise()!.difficulty] || difficultyMap.beginner;
  };

  const stepsList = () => {
    if (!exercise()?.steps) return [];
    return exercise()!.steps!.split('\n').filter(s => s.trim());
  };

  return (
    <div>
      <div style={{ 'margin-bottom': '20px' }}>
        <A href="/exercises" style={{ color: 'var(--text-secondary)', 'font-size': '14px' }}>
          ← 返回动作库
        </A>
      </div>

      {exercise.loading && (
        <div style={{ 'text-align': 'center', padding: '40px', color: 'var(--text-muted)' }}>
          加载中...
        </div>
      )}

      {exercise.error && (
        <div class="card" style={{ color: 'var(--danger-color)' }}>
          加载失败：{exercise.error.message}
        </div>
      )}

      {exercise() && (
        <div>
          <div class="card mb-8">
            <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'flex-start', 'margin-bottom': '16px' }}>
              <div>
                <h1 style={{ 'font-size': '24px', 'font-weight': '700', 'margin-bottom': '8px' }}>
                  {exercise()!.name}
                </h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span class={`badge ${diff().class}`}>{diff().label}</span>
                  <span class="badge badge-secondary">{exercise()!.primary_muscle}</span>
                  {exercise()!.equipment && (
                    <span class="badge badge-secondary">{exercise()!.equipment}</span>
                  )}
                </div>
              </div>
            </div>

            {exercise()!.secondary_muscles && (
              <div style={{ 'margin-bottom': '16px' }}>
                <span class="text-secondary" style={{ 'font-size': '14px' }}>辅助肌群：</span>
                <span style={{ 'font-size': '14px' }}>{exercise()!.secondary_muscles}</span>
              </div>
            )}

            {exercise()!.video_url && (
              <div style={{
                position: 'relative',
                width: '100%',
                'aspect-ratio': '16/9',
                'border-radius': 'var(--radius-md)',
                overflow: 'hidden',
                'margin-bottom': '20px',
                background: '#000',
              }}>
                <iframe
                  src={exercise()!.video_url}
                  title={exercise()!.name}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                />
              </div>
            )}

            {stepsList().length > 0 && (
              <div style={{ 'margin-bottom': '20px' }}>
                <h3 style={{ 'font-size': '16px', 'font-weight': '600', 'margin-bottom': '12px' }}>动作步骤</h3>
                <ol style={{ 'padding-left': '20px', color: 'var(--text-secondary)', 'line-height': '2' }}>
                  {stepsList().map((step, i) => (
                    <li>{step.replace(/^\d+\.\s*/, '')}</li>
                  ))}
                </ol>
              </div>
            )}

            {exercise()!.tips && (
              <div>
                <h3 style={{ 'font-size': '16px', 'font-weight': '600', 'margin-bottom': '8px' }}>训练要点</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{exercise()!.tips}</p>
              </div>
            )}
          </div>

          <div class="grid grid-2 mb-8">
            <div class="card">
              <h3 style={{ 'font-size': '16px', 'font-weight': '600', 'margin-bottom': '16px' }}>个人记录</h3>
              {pr() ? (
                <div>
                  <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-bottom': '12px' }}>
                    <span class="text-secondary">最大重量</span>
                    <span style={{ 'font-weight': '600', color: 'var(--primary-color)' }}>{pr()!.max_weight} kg</span>
                  </div>
                  <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-bottom': '12px' }}>
                    <span class="text-secondary">最多次数</span>
                    <span style={{ 'font-weight': '600' }}>{pr()!.max_reps} 次</span>
                  </div>
                  <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
                    <span class="text-secondary">达成时间</span>
                    <span style={{ 'font-size': '13px' }}>{formatDate(pr()!.achieved_at)}</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', 'text-align': 'center', padding: '20px' }}>
                  暂无记录
                </div>
              )}
            </div>

            <div class="card">
              <h3 style={{ 'font-size': '16px', 'font-weight': '600', 'margin-bottom': '16px' }}>容量趋势（12周）</h3>
              <VolumeChart data={volumeData()} height={160} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseDetail;
