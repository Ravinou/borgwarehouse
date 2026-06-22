import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { Repository, Optional } from '~/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type StorageUsedChartBarProps = {
  data: Optional<Array<Repository>>;
  theme?: string;
};

export default function StorageUsedChartBar({ data, theme }: StorageUsedChartBarProps) {
  const isDark = theme === 'dark';

  //Theme-aware palette pulled from the design tokens.
  const primary = isDark ? '#8b6bff' : '#6d4aff';
  const primaryHover = isDark ? '#9d82ff' : '#5c3dff';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(17, 24, 39, 0.07)';
  const tickColor = isDark ? '#9aa1b3' : '#65748b';
  const tooltipBg = isDark ? '#1b1f28' : '#ffffff';
  const tooltipText = isDark ? '#f3f4f8' : '#111827';
  const tooltipBorder = isDark ? '#333a49' : '#e4e3ef';

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tooltipText,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y}% used`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: tickColor, font: { size: 12 } },
      },
      y: {
        max: 100,
        min: 0,
        grid: { color: gridColor },
        border: { display: false },
        ticks: {
          color: tickColor,
          stepSize: 20,
          callback: (value: number | string) => value + '%',
        },
      },
    },
  };

  const labels = data?.map((repo) => repo.alias);

  const dataChart = {
    labels,
    datasets: [
      {
        label: 'Storage used (%)',
        //storageUsed is in kB, storageSize is in GB. Round to 1 decimal for %.
        data: data?.map((repo) =>
          repo.storageSize
            ? (((repo.storageUsed / 1024 ** 2) * 100) / repo.storageSize).toFixed(1)
            : 0
        ),
        backgroundColor: primary,
        hoverBackgroundColor: primaryHover,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 56,
      },
    ],
  };

  return <Bar options={options} data={dataChart} />;
}
