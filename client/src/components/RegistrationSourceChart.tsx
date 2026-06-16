import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Color palette for different OAuth providers
const providerColors: Record<string, { bg: string; border: string }> = {
  google: {
    bg: "rgba(66, 133, 244, 0.7)",
    border: "rgb(66, 133, 244)",
  },
  github: {
    bg: "rgba(36, 41, 46, 0.7)",
    border: "rgb(36, 41, 46)",
  },
  facebook: {
    bg: "rgba(24, 119, 242, 0.7)",
    border: "rgb(24, 119, 242)",
  },
  twitter: {
    bg: "rgba(29, 161, 242, 0.7)",
    border: "rgb(29, 161, 242)",
  },
  unknown: {
    bg: "rgba(156, 163, 175, 0.7)",
    border: "rgb(156, 163, 175)",
  },
};

export function RegistrationSourceChart() {
  const [days, setDays] = useState(30);

  const { data, isLoading, refetch } = trpc.admin.getRegistrationSources.useQuery({
    days,
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const chartData = {
    labels: data?.labels || [],
    datasets: (data?.datasets || []).map((dataset) => {
      const method = dataset.method.toLowerCase();
      const colors = providerColors[method] || providerColors.unknown;
      
      return {
        label: dataset.label,
        data: dataset.data,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderWidth: 1,
      };
    }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#fff",
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        callbacks: {
          footer: (tooltipItems: any) => {
            const total = tooltipItems.reduce((sum: number, item: any) => sum + item.parsed.y, 0);
            return `Total: ${total}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          color: "#9ca3af",
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: "#9ca3af",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
      },
    },
  };

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
  };

  return (
    <Card className="bg-[#0d1e36] border-[#1e3a5f]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Registration Sources</CardTitle>
            <CardDescription>
              User signups by OAuth provider - {data?.totalRegistrations || 0} total in last {days} days
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={days === 7 ? "default" : "outline"}
              size="sm"
              onClick={() => handleDaysChange(7)}
              className={days === 7 ? "" : "border-[#1e3a5f]"}
            >
              7 Days
            </Button>
            <Button
              variant={days === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => handleDaysChange(30)}
              className={days === 30 ? "" : "border-[#1e3a5f]"}
            >
              30 Days
            </Button>
            <Button
              variant={days === 90 ? "default" : "outline"}
              size="sm"
              onClick={() => handleDaysChange(90)}
              className={days === 90 ? "" : "border-[#1e3a5f]"}
            >
              90 Days
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="h-[300px]">
              <Bar data={chartData} options={options} />
            </div>
            
            {/* Summary Stats */}
            {data && data.totalsByMethod && Object.keys(data.totalsByMethod).length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data.totalsByMethod).map(([method, count]) => {
                  const colors = providerColors[method.toLowerCase()] || providerColors.unknown;
                  const percentage = data.totalRegistrations > 0
                    ? ((count / data.totalRegistrations) * 100).toFixed(1)
                    : "0.0";
                  
                  return (
                    <div
                      key={method}
                      className="p-4 rounded-lg bg-[#050b1a] border border-[#1e3a5f]"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: colors.border }}
                        />
                        <span className="text-sm font-medium capitalize">{method}</span>
                      </div>
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-xs text-gray-400">{percentage}% of total</div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
