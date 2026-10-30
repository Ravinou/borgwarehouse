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
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import type { ChartOptions } from 'chart.js';
import { Repository, Optional } from '~/types';
import classes from './StorageUsedChartBar.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MIN_BAR_SLOT_PX = 36;
const MAX_LABEL_LENGTH = 12;

//storageUsed is in kB, storageSize is in GB.
const usedPercent = (repo: Repository) =>
  repo.storageSize ? ((repo.storageUsed / 1024 ** 2) * 100) / repo.storageSize : 0;

const truncate = (label: string) =>
  label.length > MAX_LABEL_LENGTH ? `${label.slice(0, MAX_LABEL_LENGTH - 1)}…` : label;

type StorageUsedChartBarProps = {
  data: Optional<Array<Repository>>;
  theme?: string;
};

export default function StorageUsedChartBar({ data, theme }: StorageUsedChartBarProps) {
  const isDark = theme === 'dark';
  const repos = [...(data ?? [])].sort((a, b) => usedPercent(b) - usedPercent(a));
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  const updateOverflow = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setOverflow((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [updateOverflow]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    el?.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  //Theme-aware palette pulled from the design tokens.
  const primary = isDark ? '#8b6bff' : '#6d4aff';
  const primaryHover = isDark ? '#9d82ff' : '#5c3dff';
  const archivedColor = isDark ? '#4a5163' : '#c4c8d4';
  const archivedHover = isDark ? '#5a6275' : '#b0b5c4';
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
          label: (context) =>
            `${context.parsed.y}% used${repos[context.dataIndex]?.archived ? ' (archived)' : ''}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: tickColor,
          font: { size: 12 },
          autoSkip: false,
          maxRotation: 60,
          callback(value) {
            return truncate(this.getLabelForValue(Number(value)));
          },
        },
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

  const dataChart = {
    labels: repos.map((repo) => repo.alias),
    datasets: [
      {
        label: 'Storage used (%)',
        data: repos.map((repo) => Number(usedPercent(repo).toFixed(1))),
        backgroundColor: repos.map((repo) => (repo.archived ? archivedColor : primary)),
        hoverBackgroundColor: repos.map((repo) => (repo.archived ? archivedHover : primaryHover)),
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 56,
      },
    ],
  };

  return (
    <div className={classes.container}>
      <div ref={scrollerRef} className={classes.scroller} onScroll={updateOverflow}>
        <div
          className={classes.canvasArea}
          style={{ minWidth: `${repos.length * MIN_BAR_SLOT_PX}px` }}
        >
          <Bar options={options} data={dataChart} />
        </div>
      </div>
      <button
        type='button'
        className={`${classes.edge} ${classes.edgeLeft} ${overflow.left ? classes.edgeVisible : ''}`}
        onClick={() => scrollByPage(-1)}
        aria-label='Scroll chart left'
        tabIndex={overflow.left ? 0 : -1}
      >
        <span className={classes.edgeIcon}>
          <IconChevronLeft size={18} />
        </span>
      </button>
      <button
        type='button'
        className={`${classes.edge} ${classes.edgeRight} ${overflow.right ? classes.edgeVisible : ''}`}
        onClick={() => scrollByPage(1)}
        aria-label='Scroll chart right'
        tabIndex={overflow.right ? 0 : -1}
      >
        <span className={classes.edgeIcon}>
          <IconChevronRight size={18} />
        </span>
      </button>
    </div>
  );
}
