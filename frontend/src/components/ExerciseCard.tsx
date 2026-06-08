import { Component } from 'solid-js';
import { A } from '@solidjs/router';
import type { Exercise } from '../types';
import { difficultyMap } from '../stores/appStore';

interface Props {
  exercise: Exercise;
}

const ExerciseCard: Component<Props> = (props) => {
  const ex = () => props.exercise;
  const diff = () => difficultyMap[ex().difficulty] || difficultyMap.beginner;

  return (
    <A href={`/exercises/${ex().id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div class="card" style={{ height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'flex-start', 'margin-bottom': '12px' }}>
          <h3 style={{ 'font-size': '16px', 'font-weight': '600', color: 'var(--text-primary)' }}>{ex().name}</h3>
          <span class={`badge ${diff().class}`}>{diff().label}</span>
        </div>

        <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px', 'margin-bottom': '12px' }}>
          <span class="badge badge-secondary">{ex().primary_muscle}</span>
          {ex().equipment && <span class="badge badge-secondary">{ex().equipment}</span>}
        </div>

        {ex().video_url && (
          <div style={{
            width: '100%',
            'aspect-ratio': '16/9',
            background: 'var(--bg-tertiary)',
            'border-radius': 'var(--radius-sm)',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            color: 'var(--text-muted)',
            'font-size': '12px',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}

        {ex().steps && (
          <p style={{
            'font-size': '13px',
            color: 'var(--text-secondary)',
            'margin-top': '12px',
            display: '-webkit-box',
            '-webkit-line-clamp': '2',
            '-webkit-box-orient': 'vertical',
            overflow: 'hidden',
          }}>
            {ex().steps.split('\n').slice(0, 2).join(' ')}
          </p>
        )}
      </div>
    </A>
  );
};

export default ExerciseCard;
