import { Component, createEffect, onMount, onCleanup } from 'solid-js';
import { Chart, registerables } from 'chart.js';
import type { WeeklyVolume } from '../types';

Chart.register(...registerables);

interface Props {
  data: WeeklyVolume[];
  title?: string;
  height?: number;
}

const VolumeChart: Component<Props> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let chart: Chart | null = null;

  const createChart = () => {
    if (!canvasRef) return;

    if (chart) {
      chart.destroy();
    }

    const labels = props.data.map(d => {
      const date = new Date(d.week_start);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const data = props.data.map(d => d.total_volume);

    chart = new Chart(canvasRef, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '训练容量 (kg)',
          data,
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: !!props.title,
            text: props.title || '',
            font: {
              size: 14,
              weight: '600',
            },
            color: 'var(--text-primary)',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(1)} 吨`;
                }
                return `${value.toFixed(0)} 公斤`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              color: 'var(--text-secondary)',
              font: {
                size: 11,
              },
              callback: (value) => {
                const num = value as number;
                if (num >= 1000) {
                  return `${(num / 1000).toFixed(0)}t`;
                }
                return num;
              }
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: 'var(--text-secondary)',
              font: {
                size: 11,
              },
            },
          },
        },
      },
    });
  };

  createEffect(() => {
    if (props.data.length > 0) {
      createChart();
    }
  });

  onCleanup(() => {
    if (chart) {
      chart.destroy();
    }
  });

  return (
    <div style={{ height: props.height || '200px', width: '100%' }}>
      {props.data.length === 0 ? (
        <div style={{
          height: '100%',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          color: 'var(--text-muted)',
          'font-size': '14px',
        }}>
          暂无数据
        </div>
      ) : (
        <canvas ref={canvasRef}></canvas>
      )}
    </div>
  );
};

export default VolumeChart;
