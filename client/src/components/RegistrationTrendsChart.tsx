import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type Period = "daily" | "weekly" | "monthly";

export function RegistrationTrendsChart() {
  const [period, setPeriod] = useState<Period>("daily");
  const [days, setDays] = useState(30);

  const { data, isLoading, refetch } = trpc.admin.getRegistrationTrends.useQuery({
    period,
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
    datasets: [
      {
        label: "New Registrations",
        data: data?.data || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
      },
    },
  };

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    // Adjust days based on period
    if (newPeriod === "daily") {
      setDays(30);
    } else if (newPeriod === "weekly") {
      setDays(84); // ~12 weeks
    } else {
      setDays(365); // 12 months
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Registration Trends</CardTitle>
            <CardDescription>
              {data?.totalRegistrations || 0} new users in the last {days} days
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={period === "daily" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange("daily")}
            >
              Daily
            </Button>
            <Button
              variant={period === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange("weekly")}
            >
              Weekly
            </Button>
            <Button
              variant={period === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange("monthly")}
            >
              Monthly
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
          <div className="h-[300px]">
            <Line data={chartData} options={options} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
