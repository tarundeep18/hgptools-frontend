import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

const DevicesChart = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/analytics/devices`)
      .then((res) => res.json())
      .then((rows) => {
        const labels = rows.map((r) => r.keys[0]);
        const clicks = rows.map((r) => r.clicks);
        const impressions = rows.map((r) => r.impressions);

        setData({ labels, clicks, impressions });
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  const doughnutData = {
    labels: data.labels,
    datasets: [
      {
        label: "Clicks",
        data: data.clicks,
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
        hoverOffset: 4,
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };
  const barData = {
    labels: data.labels,
    datasets: [
      {
        label: "Clicks",
        data: data.clicks,
        backgroundColor: "#3b82f6",
        borderRadius: 6,
      },
      {
        label: "Impressions",
        data: data.impressions,
        backgroundColor: "#93c5fd",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { usePointStyle: true, padding: 20 },
      },
    },
  };

  return (
    <div className="max-w-8xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <header className="mb-10 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Device Analytics
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Understand how users are accessing your platform across different
          hardware.
        </p>
      </header>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card 1: Doughnut */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Traffic Distribution
            </h3>
            <p className="text-sm text-gray-500">
              Percentage of clicks per device category
            </p>
          </div>
          <div className="h-[300px] relative">
            <Doughnut data={doughnutData} options={options} />
          </div>
        </div>

        {/* Card 2: Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Engagement Metrics
            </h3>
            <p className="text-sm text-gray-500">
              Comparison of reach vs. actual interaction
            </p>
          </div>
          <div className="h-[300px]">
            <Bar data={barData} options={options} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevicesChart;
