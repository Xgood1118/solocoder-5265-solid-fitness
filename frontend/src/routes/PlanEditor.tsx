import { Component, createSignal, createEffect, For } from 'solid-js';
import { createResource } from 'solid-js';
import { useParams, A, useNavigate } from '@solidjs/router';
import { api } from '../utils/api';
import type { TrainingDay, Exercise, PlanDetail } from '../types';

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const PlanEditor: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const isEdit = () => !!params.id;
  const planId = () => params.id ? parseInt(params.id) : 0;

  const [planName, setPlanName] = createSignal('');
  const [planDescription, setPlanDescription] = createSignal('');
  const [selectedDays, setSelectedDays] = createSignal<{ training_day_id: number; day_of_week: number; order_index: number }[]>([]);

  const [trainingDays] = createResource(
    () => api.trainingDays.list(),
    { initialValue: [] as TrainingDay[] }
  );

  const [planDetail] = createResource(
    () => isEdit() ? planId() : null,
    (id) => api.plans.get(id),
  );

  createEffect(() => {
    if (planDetail()) {
      const detail = planDetail() as PlanDetail;
      setPlanName(detail.plan.name);
      setPlanDescription(detail.plan.description || '');
      setSelectedDays(
        detail.days.map(d => ({
          training_day_id: d.plan_day.training_day_id,
          day_of_week: d.plan_day.day_of_week,
          order_index: d.plan_day.order_index,
        }))
      );
    }
  });

  const addDay = () => {
    const days = selectedDays();
    const nextDayOfWeek = days.length > 0
      ? (Math.max(...days.map(d => d.day_of_week)) + 1) % 7
      : 0;

    setSelectedDays([...days, {
      training_day_id: trainingDays()[0]?.id || 0,
      day_of_week: nextDayOfWeek,
      order_index: days.length,
    }]);
  };

  const updateDay = (index: number, field: string, value: number) => {
    const days = [...selectedDays()];
    (days[index] as any)[field] = value;
    setSelectedDays(days);
  };

  const removeDay = (index: number) => {
    const days = selectedDays().filter((_, i) => i !== index);
    setSelectedDays(days.map((d, i) => ({ ...d, order_index: i })));
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!planName()) {
      alert('请输入计划名称');
      return;
    }

    try {
      const data = {
        name: planName(),
        description: planDescription() || undefined,
        start_date: undefined,
        days: selectedDays(),
      };

      if (isEdit()) {
        alert('编辑功能：请先删除旧计划再创建新的（冻结机制）');
        return;
      } else {
        await api.plans.create(data as any);
      }

      navigate('/plans');
    } catch (err) {
      alert('保存失败：' + (err as Error).message);
    }
  };

  return (
    <div>
      <div style={{ 'margin-bottom': '20px' }}>
        <A href="/plans" style={{ color: 'var(--text-secondary)', 'font-size': '14px' }}>
          ← 返回计划列表
        </A>
      </div>

      <div class="page-header">
        <h1 class="page-title">{isEdit() ? '编辑训练计划' : '新建训练计划'}</h1>
        <p class="page-subtitle">设置每周的训练日和训练内容</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div class="card mb-8">
          <div class="card-header">
            <h3 class="card-title">基本信息</h3>
          </div>

          <div class="form-group">
            <label class="form-label">计划名称 *</label>
            <input
              type="text"
              class="form-input"
              placeholder="例如：新手增肌计划、力量举计划"
              value={planName()}
              onInput={(e) => setPlanName(e.target.value)}
            />
          </div>

          <div class="form-group" style={{ margin: 0 }}>
            <label class="form-label">计划描述</label>
            <textarea
              class="form-textarea"
              placeholder="简要描述这个计划的目标和特点..."
              value={planDescription()}
              onInput={(e) => setPlanDescription(e.target.value)}
            />
          </div>
        </div>

        <div class="card mb-8">
          <div class="card-header">
            <h3 class="card-title">每周安排</h3>
            <button type="button" class="btn btn-secondary btn-sm" onClick={addDay}>
              + 添加训练日
            </button>
          </div>

          {selectedDays().length === 0 && (
            <div style={{ 'text-align': 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p>还没有安排训练日</p>
              <button type="button" class="btn btn-primary btn-sm mt-4" onClick={addDay}>
                添加第一个训练日
              </button>
            </div>
          )}

          {selectedDays().length > 0 && (
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
              <For each={selectedDays()}>
                {(day, index) => (
                  <div style={{
                    display: 'grid',
                    'grid-template-columns': '120px 1fr 100px 40px',
                    gap: '12px',
                    'align-items': 'center',
                    padding: '12px',
                    background: 'var(--bg-tertiary)',
                    'border-radius': 'var(--radius-sm)',
                  }}>
                    <select
                      class="form-select"
                      value={day.day_of_week}
                      onChange={(e) => updateDay(index(), 'day_of_week', parseInt(e.target.value))}
                    >
                      {dayNames.map((name, i) => (
                        <option value={i}>{name}</option>
                      ))}
                    </select>

                    <select
                      class="form-select"
                      value={day.training_day_id}
                      onChange={(e) => updateDay(index(), 'training_day_id', parseInt(e.target.value))}
                    >
                      <For each={trainingDays()}>
                        {(td) => <option value={td.id}>{td.name}</option>}
                      </For>
                    </select>

                    <div style={{ 'font-size': '13px', color: 'var(--text-secondary)' }}>
                      第 {index() + 1} 个
                    </div>

                    <button
                      type="button"
                      class="btn btn-secondary btn-sm"
                      onClick={() => removeDay(index())}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                )}
              </For>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', 'justify-content': 'flex-end' }}>
          <A href="/plans" class="btn btn-secondary">取消</A>
          <button type="submit" class="btn btn-primary">
            {isEdit() ? '保存修改' : '创建计划'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlanEditor;
