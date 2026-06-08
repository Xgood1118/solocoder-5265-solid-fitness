import { Component, createEffect, onCleanup } from 'solid-js';
import { restTimer, stopRestTimer, formatDuration } from '../stores/appStore';

const RestTimer: Component = () => {
  const timer = restTimer;

  const handleVisibilityChange = () => {
    if (document.hidden && timer().active) {
    }
  };

  createEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    onCleanup(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  });

  if (!timer().active) {
    return null;
  }

  const progress = ((timer().duration - timer().remaining) / timer().duration) * 100;
  const isLow = timer().remaining <= 10;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: isLow ? 'var(--danger-color)' : 'var(--primary-color)',
        color: 'white',
        padding: '16px 24px',
        'border-radius': 'var(--radius-lg)',
        'box-shadow': 'var(--shadow-lg)',
        'z-index': 100,
        'min-width': '180px',
      }}
    >
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '8px' }}>
        <span style={{ 'font-size': '14px', opacity: 0.9 }}>组间休息</span>
        <button
          onClick={stopRestTimer}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            opacity: 0.8,
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div style={{ 'font-size': '32px', 'font-weight': '700', 'text-align': 'center', 'margin-bottom': '8px' }}>
        {formatDuration(timer().remaining)}
      </div>
      <div
        style={{
          height: '4px',
          background: 'rgba(255,255,255,0.3)',
          'border-radius': '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'white',
            transition: 'width 0.3s linear',
          }}
        />
      </div>
    </div>
  );
};

export default RestTimer;
