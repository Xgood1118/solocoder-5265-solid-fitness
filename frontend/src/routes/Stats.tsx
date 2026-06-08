import { Component, createSignal, For } from 'solid-js';
import { createResource } from 'solid-js';
import { api } from '../utils/api';
import VolumeChart from '../components/VolumeChart';
import type { PrRecord, WeeklyVolume } from '../types';
import { formatVolume } from '../stores/appStore';

const Stats: Component = () => {
  const [weeks, setWeeks] = createSignal(12);

  const [prs] = createResource(
    () => api.stats.prs(),
    { initialValue: [] as PrRecord[] }
  );

  const [weeklyVolume] = createResource(
    () => weeks(),
    (w) => api.stats.weeklyVolume(w),
    { initialValue: [] as WeeklyVolume[] }
  );

  const totalVolume = () => {
    return weeklyVolume().reduce((sum, w) => sum + w.total_volume, 0);
  };

  const avgVolumePerWeek = () => {
    if (weeklyVolume().length === 0) return 0;
    return totalVolume() / weeklyVolume().length;
  };

  const totalSessions = () => {
    return weeklyVolume().reduce((sum, w) => sum + w.session_count, 0);
  };

  return (
    <div>
      <div class="page-header">
        <h1 class="page-title">数据统计</h1>
        <p class="page-subtitle">查看你的训练数据和进步趋势</p>
      </div>

      <div class="grid grid-4 mb-8">
        <div class="card">
          <div style={{ 'font-size': '13px', color: 'var(--text-secondary)', 'margin-bottom': '8px' }}>
            总训练容量
          </div>
          <div style={{ 'font-size': '24px', 'font-weight': '700', color: 'var(--primary-color)' }}>
            {formatVolume(totalVolume())}
          </div>
          <div style={{ 'font-size': '12px', color: 'var(--text-muted)', 'margin-top': '4px' }}>
            最近 {weeks()} 周
          </div>
        </div>
        <div class="card">
          <div style={{ 'font-size': '13px', color: 'var(--text-secondary)', 'margin-bottom': '8px' }}>
            周均容量
          </div>
          <div style={{ 'font-size': '24px', 'font-weight': '700' }}>
            {formatVolume(avgVolumePerWeek())}
          </div>
          <div style={{ 'font-size': '12px', color: 'var(--text-muted)', 'margin-top': '4px' }}>
            平均每周
          </div>
        </div>
        <div class="card">
          <div style={{ 'font-size': '13px', color: 'var(--text-secondary)', 'margin-bottom': '8px' }}>
            训练次数
          </div>
          <div style={{ 'font-size': '24px', 'font-weight': '700', color: 'var(--warning-color)' }}>
            {totalSessions()} <span style={{ 'font-size': '14px', 'font-weight': '400' }}>次</span>
          </div>
          <div style={{ 'font-size': '12px', color: 'var(--text-muted)', 'margin-top': '4px' }}>
            最近 {weeks()} 周
          </div>
        </div>
        <div class="card">
          <div style={{ 'font-size': '13px', color: 'var(--text-secondary)', 'margin-bottom': '8px' }}>
            PR 数量
          </div>
          <div style={{ 'font-size': '24px', 'font-weight': '700', color: 'var(--danger-color)' }}>
            {prs().length} <span style={{ 'font-size': '14px', 'font-weight': '400' }}>个</span>
          </div>
          <div style={{ 'font-size': '12px', color: 'var(--text-muted)', 'margin-top': '4px' }}>
            个人纪录
          </div>
        </div>
      </div>

      <div class="card mb-8">
        <div class="card-header">
          <h3 class="card-title">容量趋势</h3>
          <select
            class="form-select"
            style={{ width: '120px' }}
            value={weeks()}
            onChange={(e) => setWeeks(parseInt(e.target.value))}
          >
            <option value={4}>最近 4 周</option>
            <option value={8}>最近 8 周</option>
            <option value={12}>最近 12 周</option>
            <option value={24}>最近 24 周</option>
          </select>
        </div>
        <VolumeChart data={weeklyVolume()} height={280} />
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">个人纪录 (PR)</h3>
        </div>

        {prs.loading && (
          <div style={{ 'text-align': 'center', padding: '40px', color: 'var(--text-muted)' }}>
            加载中...
          </div>
        )}

        {!prs.loading && prs().length === 0 && (
          <div style={{ 'text-align': 'center', padding: '40px', color: 'var(--text-muted)' }}>
            还没有 PR 记录，加油训练吧！
          </div>
        )}

        {!prs.loading && prs().length > 0 && (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', 'border-collapse': 'collapse' }}>
              <thead>
                <tr style={{ 'border-bottom': '1px solid var(--border-color)' }}>
                  <th style={{ 'text-align': 'left', padding: '12px', 'font-weight': '600', 'font-size': '13px', color: 'var(--text-secondary)' }}>动作</th>
                  <th style={{ 'text-align': 'right', padding: '12px', 'font-weight': '600', 'font-size': '13px', color: 'var(--text-secondary)' }}>最大重量</th>
                  <th style={{ 'text-align': 'right', padding: '12px', 'font-weight': '600', 'font-size': '13px', color: 'var(--text-secondary)' }}>最多次数</th>
                  <th style={{ 'text-align': 'right', padding: '12px', 'font-weight': '600', 'font-size': '13px', color: 'var(--text-secondary)' }}>达成时间</th>
                </tr>
              </thead>
              <tbody>
                <For each={prs()}>
                  {(pr) => (
                    <tr style={{ 'border-bottom': '1px solid var(--bg-tertiary)' }}>
                      <td style={{ padding: '12px', 'font-weight': '500' }}>{pr.exercise_name}</td>
                      <td style={{ padding: '12px', 'text-align': 'right', color: 'var(--primary-color)', 'font-weight': '600' }}>
                        {pr.max_weight} kg
                      </td>
                      <td style={{ padding: '12px', 'text-align': 'right' }}>{pr.max_reps} 次</td>
                      <td style={{ padding: '12px', 'text-align': 'right', color: 'var(--text-muted)', 'font-size': '13px' }}>
                        {new Date(pr.achieved_at).toLocaleDateString('zh-CN')}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;
