import { Component, createSignal, createEffect, For } from 'solid-js';
import { createResource } from 'solid-js';
import { A } from '@solidjs/router';
import { api } from '../utils/api';
import type { CalendarDay } from '../types';

const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

const Calendar: Component = () => {
  const today = new Date();
  const [currentYear, setCurrentYear] = createSignal(today.getFullYear());
  const [currentMonth, setCurrentMonth] = createSignal(today.getMonth() + 1);

  const [calendarData, { refetch }] = createResource(
    () => ({ year: currentYear(), month: currentMonth() }),
    ({ year, month }) => api.stats.calendar(year, month),
    { initialValue: [] as CalendarDay[] }
  );

  createEffect(() => {
    refetch();
  });

  const firstDayOfMonth = () => {
    const date = new Date(currentYear(), currentMonth() - 1, 1);
    return date.getDay();
  };

  const daysInMonth = () => {
    const date = new Date(currentYear(), currentMonth(), 0);
    return date.getDate();
  };

  const calendarDays = () => {
    const days: (CalendarDay | null)[] = [];
    for (let i = 0; i < firstDayOfMonth(); i++) {
      days.push(null);
    }

    const data = calendarData();
    for (let day = 1; day <= daysInMonth(); day++) {
      const dateStr = `${currentYear()}-${String(currentMonth()).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const calDay = data.find(d => d.date === dateStr);
      if (calDay) {
        days.push(calDay);
      } else {
        days.push({
          date: dateStr,
          has_workout: false,
          muscles: [],
        });
      }
    }

    return days;
  };

  const prevMonth = () => {
    if (currentMonth() === 1) {
      setCurrentYear(y => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth() === 12) {
      setCurrentYear(y => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  const isToday = (dateStr: string) => {
    const todayStr = today.toISOString().split('T')[0];
    return dateStr === todayStr;
  };

  const getMuscleColor = (muscle: string) => {
    const colors: Record<string, string> = {
      '胸部': '#ef4444',
      '背部': '#3b82f6',
      '腿部': '#22c55e',
      '肩部': '#f59e0b',
      '肱二头肌': '#8b5cf6',
      '肱三头肌': '#ec4899',
      '核心': '#14b8a6',
      '腹部': '#14b8a6',
      '小腿': '#6b7280',
    };
    return colors[muscle] || '#6b7280';
  };

  return (
    <div>
      <div class="page-header">
        <h1 class="page-title">训练日历</h1>
        <p class="page-subtitle">查看历史训练记录，追踪训练频率</p>
      </div>

      <div class="card mb-8">
        <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '20px' }}>
          <button class="btn btn-secondary btn-sm" onClick={prevMonth}>
            ← 上月
          </button>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
            <h2 style={{ 'font-size': '18px', 'font-weight': '600' }}>
              {currentYear()}年{monthNames[currentMonth() - 1]}
            </h2>
            <button class="btn btn-outline btn-sm" onClick={goToToday}>今天</button>
          </div>
          <button class="btn btn-secondary btn-sm" onClick={nextMonth}>
            下月 →
          </button>
        </div>

        <div style={{ display: 'grid', 'grid-template-columns': 'repeat(7, 1fr)', gap: '4px', 'margin-bottom': '8px' }}>
          <For each={dayNames}>
            {(day) => (
              <div style={{
                'text-align': 'center',
                'font-size': '12px',
                'font-weight': '500',
                color: 'var(--text-secondary)',
                padding: '8px',
              }}>
                周{day}
              </div>
            )}
          </For>
        </div>

        <div style={{ display: 'grid', 'grid-template-columns': 'repeat(7, 1fr)', gap: '4px' }}>
          <For each={calendarDays()}>
            {(day) => {
              if (!day) {
                return <div style={{ height: '80px' }}></div>;
              }

              const dayNum = parseInt(day.date.split('-')[2]);

              return (
                <A
                  href={day.has_workout ? `/workout/${day.session_id}` : '/workout/new'}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    style={{
                      height: '80px',
                      padding: '8px',
                      'border-radius': 'var(--radius-sm)',
                      background: day.has_workout ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-tertiary)',
                      border: isToday(day.date) ? '2px solid var(--primary-color)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      'font-size': '12px',
                      display: 'flex',
                      'flex-direction': 'column',
                      gap: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      'font-weight': isToday(day.date) ? '700' : '500',
                      color: isToday(day.date) ? 'var(--primary-color)' : 'var(--text-primary)',
                    }}>
                      {dayNum}
                    </div>
                    {day.has_workout && (
                      <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '2px' }}>
                        {day.muscles.slice(0, 2).map(muscle => (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            'border-radius': '50%',
                            background: getMuscleColor(muscle),
                            display: 'inline-block',
                          }}></span>
                        ))}
                      </div>
                    )}
                    {day.has_workout && (
                      <div style={{ 'font-size': '10px', color: 'var(--text-muted)', 'margin-top': 'auto' }}>
                        已训练
                      </div>
                    )}
                  </div>
                </A>
              );
            }}
          </For>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">本月训练统计</h3>
        </div>
        <div class="grid grid-4">
          <div style={{ 'text-align': 'center', padding: '16px' }}>
            <div style={{ 'font-size': '32px', 'font-weight': '700', color: 'var(--primary-color)' }}>
              {calendarData().filter(d => d.has_workout).length}
            </div>
            <div style={{ 'font-size': '13px', color: 'var(--text-secondary)' }}>训练天数</div>
          </div>
          <div style={{ 'text-align': 'center', padding: '16px' }}>
            <div style={{ 'font-size': '32px', 'font-weight': '700' }}>
              {[...new Set(calendarData().filter(d => d.has_workout).flatMap(d => d.muscles))].length}
            </div>
            <div style={{ 'font-size': '13px', color: 'var(--text-secondary)' }}>涉及肌群</div>
          </div>
          <div style={{ 'text-align': 'center', padding: '16px' }}>
            <div style={{ 'font-size': '32px', 'font-weight': '700', color: 'var(--warning-color)' }}>
              {daysInMonth() - calendarData().filter(d => d.has_workout).length}
            </div>
            <div style={{ 'font-size': '13px', color: 'var(--text-secondary)' }}>休息天数</div>
          </div>
          <div style={{ 'text-align': 'center', padding: '16px' }}>
            <div style={{ 'font-size': '32px', 'font-weight': '700', color: 'var(--text-muted)' }}>
              {calendarData().filter(d => d.has_workout).length > 0
                ? (calendarData().filter(d => d.has_workout).length / 4).toFixed(1)
                : '0'}
            </div>
            <div style={{ 'font-size': '13px', color: 'var(--text-secondary)' }}>周均频率</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
