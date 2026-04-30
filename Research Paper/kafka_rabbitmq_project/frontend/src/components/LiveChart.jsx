import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './LiveChart.css';

export function LiveChart({ data, broker, nodes }) {
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!chartCanvasRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = new Chart(chartCanvasRef.current, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Throughput (msg/s)',
              data: [],
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              tension: 0.3,
              fill: false,
              yAxisID: 'y1',
              pointRadius: 4,
              pointBackgroundColor: '#3b82f6',
              pointBorderWidth: 0,
              borderWidth: 2.5
            },
            {
              label: 'Latency (ms)',
              data: [],
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              tension: 0.3,
              fill: false,
              yAxisID: 'y2',
              pointRadius: 4,
              pointBackgroundColor: '#ef4444',
              pointBorderWidth: 0,
              borderWidth: 2.5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { labels: { color: '#f1f5f9', font: { size: 12, weight: '600' }, padding: 15 } }
          },
          scales: {
            y1: {
              type: 'linear',
              position: 'left',
              ticks: {
                color: 'rgba(255, 255, 255, 0.6)',
                callback: v => v >= 1e6 ? (v/1e6).toFixed(1) + 'M' : v >= 1e3 ? (v/1e3).toFixed(0) + 'K' : v
              },
              grid: { color: 'rgba(59, 130, 246, 0.1)' }
            },
            y2: {
              type: 'linear',
              position: 'right',
              ticks: { color: 'rgba(255, 255, 255, 0.6)', callback: v => v + 'ms' },
              grid: { drawOnChartArea: false }
            },
            x: {
              ticks: { color: 'rgba(255, 255, 255, 0.6)' },
              grid: { color: 'rgba(59, 130, 246, 0.1)' }
            }
          }
        }
      });
    }

    if (data.labels.length > 0) {
      chartInstanceRef.current.data.labels = data.labels;
      chartInstanceRef.current.data.datasets[0].data = data.throughput;
      chartInstanceRef.current.data.datasets[1].data = data.latency;
      chartInstanceRef.current.update('none');
    }
  }, [data]);

  return (
    <div className="chart-section">
      <div className="chart-title">Real-time Metrics Feed ({broker.toUpperCase()} @ {nodes}n)</div>
      <canvas ref={chartCanvasRef}></canvas>
    </div>
  );
}
