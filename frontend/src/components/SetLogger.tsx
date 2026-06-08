import { Component, createSignal, For } from 'solid-js';
import { startRestTimer } from '../stores/appStore';

export interface SetData {
  id: number;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  isPr?: boolean;
  withAssistance?: boolean;
  restSeconds?: number;
}

interface Props {
  exerciseId: number;
  exerciseName: string;
  sets: SetData[];
  onSetsChange: (sets: SetData[]) => void;
  defaultRestSeconds?: number;
}

const SetLogger: Component<Props> = (props) => {
  const [nextSetNum, setNextSetNum] = createSignal(props.sets.length + 1);

  const updateSet = (index: number, field: keyof SetData, value: number | boolean) => {
    const newSets = [...props.sets];
    newSets[index] = { ...newSets[index], [field]: value };
    props.onSetsChange(newSets);
  };

  const addSet = () => {
    const lastSet = props.sets[props.sets.length - 1];
    const newSet: SetData = {
      id: Date.now(),
      setNumber: nextSetNum(),
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 10,
      completed: false,
      restSeconds: props.defaultRestSeconds || 90,
    };
    props.onSetsChange([...props.sets, newSet]);
    setNextSetNum(prev => prev + 1);
  };

  const removeSet = (index: number) => {
    const newSets = props.sets.filter((_, i) => i !== index);
    const renumbered = newSets.map((s, i) => ({ ...s, setNumber: i + 1 }));
    props.onSetsChange(renumbered);
    setNextSetNum(renumbered.length + 1);
  };

  const completeSet = (index: number) => {
    updateSet(index, 'completed', true);
    const set = props.sets[index];
    if (set.restSeconds) {
      startRestTimer(set.restSeconds);
    }
  };

  const volume = () => {
    return props.sets
      .filter(s => s.completed)
      .reduce((sum, s) => sum + s.weight * s.reps, 0);
  };

  return (
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">{props.exerciseName}</h3>
          <p class="text-muted" style={{ 'font-size': '12px', 'margin-top': '4px' }}>
            已完成 {props.sets.filter(s => s.completed).length}/{props.sets.length} 组 · 容量 {volume().toFixed(0)} 公斤
          </p>
        </div>
        <button class="btn btn-secondary btn-sm" onClick={addSet}>
          + 添加组
        </button>
      </div>

      <div style={{ display: 'grid', 'grid-template-columns': '40px 1fr 1fr 80px 80px', gap: '8px', 'align-items': 'center', 'margin-bottom': '8px', 'padding': '0 8px' }}>
        <span class="text-muted" style={{ 'font-size': '12px' }}>组</span>
        <span class="text-muted" style={{ 'font-size': '12px' }}>重量 (kg)</span>
        <span class="text-muted" style={{ 'font-size': '12px' }}>次数</span>
        <span class="text-muted" style={{ 'font-size': '12px' }}>休息(s)</span>
        <span></span>
      </div>

      <For each={props.sets}>
        {(set, index) => (
          <div
            style={{
              display: 'grid',
              'grid-template-columns': '40px 1fr 1fr 80px 80px',
              gap: '8px',
              'align-items': 'center',
              padding: '8px',
              'border-radius': 'var(--radius-sm)',
              background: set.completed ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
              opacity: set.completed ? 0.7 : 1,
            }}
          >
            <div style={{ 'font-weight': '600', color: 'var(--text-secondary)' }}>
              {set.setNumber}
              {set.isPr && <span class="badge badge-danger" style={{ 'margin-left': '4px', 'font-size': '10px' }}>PR</span>}
            </div>
            <input
              type="number"
              class="form-input"
              value={set.weight}
              onInput={(e) => updateSet(index(), 'weight', parseFloat(e.target.value) || 0)}
              disabled={set.completed}
              style={{ padding: '6px 8px', 'font-size': '14px' }}
            />
            <input
              type="number"
              class="form-input"
              value={set.reps}
              onInput={(e) => updateSet(index(), 'reps', parseInt(e.target.value) || 0)}
              disabled={set.completed}
              style={{ padding: '6px 8px', 'font-size': '14px' }}
            />
            <input
              type="number"
              class="form-input"
              value={set.restSeconds || 90}
              onInput={(e) => updateSet(index(), 'restSeconds', parseInt(e.target.value) || 90)}
              style={{ padding: '6px 8px', 'font-size': '14px' }}
            />
            <div style={{ display: 'flex', gap: '4px', 'justify-content': 'flex-end' }}>
              {!set.completed ? (
                <button
                  class="btn btn-primary btn-sm"
                  onClick={() => completeSet(index())}
                  style={{ padding: '6px 10px' }}
                >
                  完成
                </button>
              ) : (
                <button
                  class="btn btn-outline btn-sm"
                  onClick={() => updateSet(index(), 'completed', false)}
                  style={{ padding: '6px 10px' }}
                >
                  撤销
                </button>
              )}
              <button
                class="btn btn-secondary btn-sm"
                onClick={() => removeSet(index())}
                style={{ padding: '6px 10px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </For>

      {props.sets.length === 0 && (
        <div style={{ 'text-align': 'center', padding: '32px', color: 'var(--text-muted)' }}>
          <p>暂无训练组</p>
          <button class="btn btn-primary btn-sm mt-4" onClick={addSet}>添加第一组</button>
        </div>
      )}
    </div>
  );
};

export default SetLogger;
