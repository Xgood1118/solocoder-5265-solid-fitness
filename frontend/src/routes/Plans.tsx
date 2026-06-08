import { Component, createResource, For } from 'solid-js';
import { A } from '@solidjs/router';
import { api } from '../utils/api';
import type { TrainingPlan } from '../types';
import { formatDate } from '../stores/appStore';

const Plans: Component = () => {
  const [plans, { refetch }] = createResource(
    () => api.plans.list(),
    { initialValue: [] as TrainingPlan[] }
  );

  const activePlans = () => plans().filter(p => p.is_active === 1);
  const inactivePlans = () => plans().filter(p => p.is_active === 0);

  const handleFreeze = async (id: number) => {
    if (confirm('确定要冻结此计划吗？冻结后将无法修改。')) {
      await api.plans.freeze(id);
      refetch();
    }
  };

  const handleActivate = async (id: number) => {
    if (confirm('确定要激活此计划吗？当前激活的计划将被冻结。')) {
      await api.plans.activate(id);
      refetch();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除此计划吗？')) {
      await api.plans.delete(id);
      refetch();
    }
  };

  return (
    <div>
      <div class="page-header" style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'flex-end' }}>
        <div>
          <h1 class="page-title">训练计划</h1>
          <p class="page-subtitle">管理你的训练计划，自由组合训练动作</p>
        </div>
        <A href="/plans/new" class="btn btn-primary">
          + 新建计划
        </A>
      </div>

      {activePlans().length > 0 && (
        <div class="mb-8">
          <h2 style={{ 'font-size': '18px', 'font-weight': '600', 'margin-bottom': '16px' }}>
            当前激活
          </h2>
          <div class="grid grid-2">
            <For each={activePlans()}>
              {(plan) => (
                <div class="card" style={{ 'border-left': '4px solid var(--primary-color)' }}>
                  <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'flex-start', 'margin-bottom': '12px' }}>
                    <div>
                      <h3 style={{ 'font-size': '18px', 'font-weight': '600' }}>{plan.name}</h3>
                      <span class="badge badge-primary" style={{ 'margin-top': '4px' }}>激活中</span>
                    </div>
                  </div>
                  {plan.description && (
                    <p style={{ color: 'var(--text-secondary)', 'margin-bottom': '12px', 'font-size': '14px' }}>
                      {plan.description}
                    </p>
                  )}
                  <div style={{ 'font-size': '13px', color: 'var(--text-muted)', 'margin-bottom': '16px' }}>
                    开始时间：{plan.start_date ? formatDate(plan.start_date) : '未设置'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <A href={`/plans/${plan.id}`} class="btn btn-secondary btn-sm">查看详情</A>
                    <button class="btn btn-outline btn-sm" onClick={() => handleFreeze(plan.id)}>
                      冻结计划
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      <div>
        <h2 style={{ 'font-size': '18px', 'font-weight': '600', 'margin-bottom': '16px' }}>
          所有计划 ({plans().length})
        </h2>

        {plans.loading && (
          <div class="card" style={{ 'text-align': 'center', padding: '40px', color: 'var(--text-muted)' }}>
            加载中...
          </div>
        )}

        {!plans.loading && plans().length === 0 && (
          <div class="card" style={{ 'text-align': 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)', 'margin-bottom': '16px' }}>还没有训练计划</p>
            <A href="/plans/new" class="btn btn-primary">创建第一个计划</A>
          </div>
        )}

        {!plans.loading && plans().length > 0 && (
          <div class="grid grid-2">
            <For each={inactivePlans()}>
              {(plan) => (
                <div class="card">
                  <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'flex-start', 'margin-bottom': '12px' }}>
                    <div>
                      <h3 style={{ 'font-size': '16px', 'font-weight': '600' }}>{plan.name}</h3>
                      {plan.frozen_at && (
                        <span class="badge badge-secondary" style={{ 'margin-top': '4px' }}>已冻结</span>
                      )}
                    </div>
                  </div>
                  {plan.description && (
                    <p style={{ color: 'var(--text-secondary)', 'margin-bottom': '12px', 'font-size': '14px' }}>
                      {plan.description}
                    </p>
                  )}
                  <div style={{ 'font-size': '13px', color: 'var(--text-muted)', 'margin-bottom': '16px' }}>
                    {plan.start_date && `开始：${formatDate(plan.start_date)}`}
                    {plan.end_date && ` · 结束：${formatDate(plan.end_date)}`}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <A href={`/plans/${plan.id}`} class="btn btn-secondary btn-sm">查看详情</A>
                    {plan.frozen_at && (
                      <button class="btn btn-primary btn-sm" onClick={() => handleActivate(plan.id)}>
                        激活
                      </button>
                    )}
                    <button class="btn btn-danger btn-sm" onClick={() => handleDelete(plan.id)}>
                      删除
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        )}
      </div>
    </div>
  );
};

export default Plans;
