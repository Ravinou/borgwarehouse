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
import { useState, useEffect } from 'react';
import { Repository, Optional } from '~/types';

export default function StorageUsedChartBar() {
  const [data, setData] = useState<Optional<Array<Repository>>>();

  useEffect(() => {
    const dataFetch = async () => {
      try {
        const response = await fetch('/api/v1/repositories', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });
        setData((await response.json()).repoList);
      } catch (error) {
        console.log('Fetching datas error');
      }
    };

    dataFetch();
  }, []);

  ////Chart.js
  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        position: 'bottom' as const,
        display: true,
        text: 'Storage used for each repository',
      },
    },
    scales: {
      y: {
        max: 100,
        min: 0,
        ticks: {
          // Include a dollar sign in the ticks
          callback: function (value: number | string) {
            return value + '%';
          },
          stepSize: 10,
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
          (((repo.storageUsed / 1024 ** 2) * 100) / repo.storageSize).toFixed(1)
        ),
        backgroundColor: '#704dff',
      },
    ],
  };

  return <Bar options={options} data={dataChart} />;
}
