import { Component, createSignal, For } from 'solid-js';
import { createResource } from 'solid-js';
import { api } from '../utils/api';
import type { BodyMeasurement, CreateBodyMeasurement } from '../types';
import { formatDate } from '../stores/appStore';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const Measurements: Component = () => {
  const [showForm, setShowForm] = createSignal(false);
  const [editingId, setEditingId] = createSignal<number | null>(null);

  const [formData, setFormData] = createSignal<CreateBodyMeasurement>({
    measure_date: new Date().toISOString().split('T')[0],
    weight: undefined,
    body_fat: undefined,
    is_fasting: false,
    chest: undefined,
    waist: undefined,
    hips: undefined,
    arm: undefined,
    thigh: undefined,
    calf: undefined,
    notes: undefined,
  });

  const [measurements, { refetch }] = createResource(
    () => api.measurements.list(),
    { initialValue: [] as BodyMeasurement[] }
  );

  const resetForm = () => {
    setFormData({
      measure_date: new Date().toISOString().split('T')[0],
      weight: undefined,
      body_fat: undefined,
      is_fasting: false,
      chest: undefined,
      waist: undefined,
      hips: undefined,
      arm: undefined,
      thigh: undefined,
      calf: undefined,
      notes: undefined,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    try {
      if (editingId()) {
        await api.measurements.update(editingId()!, formData() as any);
      } else {
        await api.measurements.create(formData() as any);
      }
      refetch();
      resetForm();
    } catch (err) {
      alert('保存失败：' + (err as Error).message);
    }
  };

  const handleEdit = (m: BodyMeasurement) => {
    setFormData({
      measure_date: m.measure_date,
      weight: m.weight,
      body_fat: m.body_fat,
      is_fasting: m.is_fasting === 1,
      chest: m.chest,
      waist: m.waist,
      hips: m.hips,
      arm: m.arm,
      thigh: m.thigh,
      calf: m.calf,
      notes: m.notes,
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这条记录吗？')) {
      await api.measurements.delete(id);
      refetch();
    }
  };

  const latestMeasurement = () => {
    if (measurements().length === 0) return null;
    return measurements()[0];
  };

  const previousMeasurement = () => {
    if (measurements().length < 2) return null;
    return measurements()[1];
  };

  const weightChange = () => {
    const latest = latestMeasurement();
    const prev = previousMeasurement();
    if (!latest?.weight || !prev?.weight) return 0;
    return latest.weight - prev.weight;
  };

  return (
    <div>
      <div class="page-header" style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'flex-end' }}>
        <div>
          <h1 class="page-title">体测记录</h1>
          <p class="page-subtitle">记录身体数据变化，追踪体测趋势</p>
        </div>
        <button class="btn btn-primary" onClick={() => setShowForm(true)}>
          + 新增记录
        </button>
      </div>

      {latestMeasurement() && (
        <div class="grid grid-4 mb-8">
          <div class="card">
            <div style={{ 'font-size': '13px', color: 'var(--text-secondary)', 'margin-bottom': '8px' }}>
              体重
            </div>
            <div style={{ display: 'flex', 'align-items': 'baseline', gap: '8px' }}>
              <span style={{ 'font-size': '24px', 'font-weight': '700' }}>
                {latestMeasurement()!.weight ?? '--'}
              </span>
              <span style={{ 'font-size': '14px', color: 'var(--text-muted)' }}>kg</span>
            </div>
            {weightChange() !== 0 && (
              <div style={{
                'font-size': '12px',
                color: weightChange() > 0 ? 'var(--danger-color)' : 'var(--primary-color)',
                'margin-top': '4px',
              }}>
                {weightChange() > 0 ? '+' : ''}{weightChange().toFixed(1)} kg
              </div>
            )}
          </div>
          <div class="card">
            <div style={{ 'font-size': '13px', color: 'var(--text-secondary)', 'margin-bottom': '8px' }}>
              体脂率
            </div>
            <div style={{ display: 'flex', 'align-items': 'baseline', gap: '8px' }}>
              <span style={{ 'font-size': '24px', 'font-weight': '700', color: 'var(--warning-color)' }}>
                {latestMeasurement()!.body_fat ?? '--'}
              </span>
              <span style={{ 'font-size': '14px', color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>
          <div class="card">
            <div style={{ 'font-size': '13px', color: 'var(--text-secondary)', 'margin-bottom': '8px' }}>
              腰围
            </div>
            <div style={{ display: 'flex', 'align-items': 'baseline', gap: '8px' }}>
              <span style={{ 'font-size': '24px', 'font-weight': '700' }}>
                {latestMeasurement()!.waist ?? '--'}
              </span>
              <span style={{ 'font-size': '14px', color: 'var(--text-muted)' }}>cm</span>
            </div>
          </div>
          <div class="card">
            <div style={{ 'font-size': '13px', color: 'var(--text-secondary)', 'margin-bottom': '8px' }}>
              记录次数
            </div>
            <div style={{ 'font-size': '24px', 'font-weight': '700', color: 'var(--primary-color)' }}>
              {measurements().length}
            </div>
            <div style={{ 'font-size': '12px', color: 'var(--text-muted)', 'margin-top': '4px' }}>
              条记录
            </div>
          </div>
        </div>
      )}

      {showForm() && (
        <div class="card mb-8">
          <div class="card-header">
            <h3 class="card-title">{editingId() ? '编辑记录' : '新增记录'}</h3>
            <button class="btn btn-secondary btn-sm" onClick={resetForm}>取消</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div class="grid grid-2">
              <div class="form-group">
                <label class="form-label">测量日期 *</label>
                <input
                  type="date"
                  class="form-input"
                  value={formData().measure_date}
                  onInput={(e) => setFormData({ ...formData(), measure_date: e.target.value })}
                />
              </div>
              <div class="form-group">
                <label class="form-label">
                  <input
                    type="checkbox"
                    checked={formData().is_fasting}
                    onInput={(e) => setFormData({ ...formData(), is_fasting: (e.target as HTMLInputElement).checked })}
                    style={{ 'margin-right': '6px' }}
                  />
                  早晨空腹测量
                </label>
              </div>
            </div>

            <div class="grid grid-3">
              <div class="form-group">
                <label class="form-label">体重 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  class="form-input"
                  value={formData().weight ?? ''}
                  onInput={(e) => setFormData({ ...formData(), weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div class="form-group">
                <label class="form-label">体脂率 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  class="form-input"
                  value={formData().body_fat ?? ''}
                  onInput={(e) => setFormData({ ...formData(), body_fat: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div class="form-group">
                <label class="form-label">胸围 (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  class="form-input"
                  value={formData().chest ?? ''}
                  onInput={(e) => setFormData({ ...formData(), chest: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div class="form-group">
                <label class="form-label">腰围 (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  class="form-input"
                  value={formData().waist ?? ''}
                  onInput={(e) => setFormData({ ...formData(), waist: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div class="form-group">
                <label class="form-label">臀围 (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  class="form-input"
                  value={formData().hips ?? ''}
                  onInput={(e) => setFormData({ ...formData(), hips: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div class="form-group">
                <label class="form-label">臂围 (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  class="form-input"
                  value={formData().arm ?? ''}
                  onInput={(e) => setFormData({ ...formData(), arm: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div class="form-group">
                <label class="form-label">大腿围 (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  class="form-input"
                  value={formData().thigh ?? ''}
                  onInput={(e) => setFormData({ ...formData(), thigh: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div class="form-group">
                <label class="form-label">小腿围 (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  class="form-input"
                  value={formData().calf ?? ''}
                  onInput={(e) => setFormData({ ...formData(), calf: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">备注</label>
              <textarea
                class="form-textarea"
                value={formData().notes ?? ''}
                onInput={(e) => setFormData({ ...formData(), notes: e.target.value || undefined })}
              />
            </div>

            <div style={{ display: 'flex', 'justify-content': 'flex-end' }}>
              <button type="submit" class="btn btn-primary">
                {editingId() ? '保存修改' : '添加记录'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">历史记录</h3>
        </div>

        {measurements.loading && (
          <div style={{ 'text-align': 'center', padding: '40px', color: 'var(--text-muted)' }}>
            加载中...
          </div>
        )}

        {!measurements.loading && measurements().length === 0 && (
          <div style={{ 'text-align': 'center', padding: '40px', color: 'var(--text-muted)' }}>
            还没有体测记录
          </div>
        )}

        {!measurements.loading && measurements().length > 0 && (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', 'border-collapse': 'collapse' }}>
              <thead>
                <tr style={{ 'border-bottom': '1px solid var(--border-color)' }}>
                  <th style={{ 'text-align': 'left', padding: '12px', 'font-weight': '600', 'font-size': '13px', color: 'var(--text-secondary)' }}>日期</th>
                  <th style={{ 'text-align': 'right', padding: '12px', 'font-weight': '600', 'font-size': '13px', color: 'var(--text-secondary)' }}>体重</th>
                  <th style={{ 'text-align': 'right', padding: '12px', 'font-weight': '600', 'font-size': '13px', color: 'var(--text-secondary)' }}>体脂</th>
                  <th style={{ 'text-align': 'right', padding: '12px', 'font-weight': '600', 'font-size': '13px', color: 'var(--text-secondary)' }}>腰围</th>
                  <th style={{ 'text-align': 'right', padding: '12px', 'font-weight': '600', 'font-size': '13px', color: 'var(--text-secondary)' }}>空腹</th>
                  <th style={{ 'text-align': 'right', padding: '12px', 'font-weight': '600', 'font-size': '13px', color: 'var(--text-secondary)' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                <For each={measurements()}>
                  {(m) => (
                    <tr style={{ 'border-bottom': '1px solid var(--bg-tertiary)' }}>
                      <td style={{ padding: '12px' }}>{formatDate(m.measure_date)}</td>
                      <td style={{ padding: '12px', 'text-align': 'right' }}>
                        {m.weight !== undefined ? `${m.weight} kg` : '-'}
                      </td>
                      <td style={{ padding: '12px', 'text-align': 'right' }}>
                        {m.body_fat !== undefined ? `${m.body_fat}%` : '-'}
                      </td>
                      <td style={{ padding: '12px', 'text-align': 'right' }}>
                        {m.waist !== undefined ? `${m.waist} cm` : '-'}
                      </td>
                      <td style={{ padding: '12px', 'text-align': 'right' }}>
                        {m.is_fasting === 1 ? (
                          <span class="badge badge-primary">是</span>
                        ) : (
                          <span class="badge badge-secondary">否</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', 'text-align': 'right' }}>
                        <button class="btn btn-secondary btn-sm" style={{ 'margin-right': '8px' }} onClick={() => handleEdit(m)}>
                          编辑
                        </button>
                        <button class="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
                          删除
                        </button>
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

export default Measurements;
