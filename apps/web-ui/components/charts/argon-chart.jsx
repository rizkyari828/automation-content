"use client";

import { useEffect, useRef } from "react";

function getChartConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.Chart?.Chart ?? window.Chart ?? null;
}

function getChartConfig(variant, context) {
  if (variant === "rtl-bars") {
    return {
      type: "bar",
      data: {
        labels: ["S", "M", "T", "W", "T", "F", "S"],
        datasets: [
          {
            label: "Users",
            backgroundColor: "#fff",
            borderRadius: 4,
            borderSkipped: false,
            data: [45, 22, 30, 18, 50, 28, 40],
            maxBarThickness: 10
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            grid: {
              drawBorder: false,
              display: false,
              drawOnChartArea: false,
              drawTicks: false
            },
            ticks: {
              display: false
            }
          },
          x: {
            grid: {
              drawBorder: false,
              display: false,
              drawOnChartArea: false,
              drawTicks: false
            },
            ticks: {
              display: true,
              color: "#fff",
              padding: 10,
              font: {
                size: 11,
                family: "Open Sans",
                style: "normal",
                lineHeight: 2
              }
            }
          }
        }
      }
    };
  }

  const gradientStroke = context.createLinearGradient(0, 230, 0, 50);
  gradientStroke.addColorStop(1, "rgba(94, 114, 228, 0.2)");
  gradientStroke.addColorStop(0.2, "rgba(94, 114, 228, 0.0)");
  gradientStroke.addColorStop(0, "rgba(94, 114, 228, 0)");

  return {
    type: "line",
    data: {
      labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      datasets: [
        {
          label: "Mobile apps",
          tension: 0.4,
          pointRadius: 0,
          borderColor: "#5e72e4",
          backgroundColor: gradientStroke,
          borderWidth: 3,
          fill: true,
          data: [50, 40, 300, 220, 500, 250, 400, 230, 500],
          maxBarThickness: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      interaction: {
        intersect: false,
        mode: "index"
      },
      scales: {
        y: {
          grid: {
            drawBorder: false,
            display: true,
            drawOnChartArea: true,
            drawTicks: false,
            borderDash: [5, 5]
          },
          ticks: {
            display: true,
            padding: 10,
            color: "#fbfbfb",
            font: {
              size: 11,
              family: "Open Sans",
              style: "normal",
              lineHeight: 2
            }
          }
        },
        x: {
          grid: {
            drawBorder: false,
            display: false,
            drawOnChartArea: false,
            drawTicks: false,
            borderDash: [5, 5]
          },
          ticks: {
            display: true,
            color: "#ccc",
            padding: 20,
            font: {
              size: 11,
              family: "Open Sans",
              style: "normal",
              lineHeight: 2
            }
          }
        }
      }
    }
  };
}

export default function ArgonChart({ variant = "dashboard-line", className = "chart-canvas", height = 300 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let chart = null;
    let intervalId = null;
    let attempts = 0;

    const mountChart = () => {
      const ChartConstructor = getChartConstructor();
      const canvas = canvasRef.current;

      if (!ChartConstructor || !canvas) {
        return false;
      }

      const context = canvas.getContext("2d");

      if (!context) {
        return false;
      }

      chart = new ChartConstructor(context, getChartConfig(variant, context));

      return true;
    };

    if (!mountChart()) {
      intervalId = window.setInterval(() => {
        attempts += 1;

        if (mountChart() || attempts >= 50) {
          window.clearInterval(intervalId);
        }
      }, 100);
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }

      if (chart) {
        chart.destroy();
      }
    };
  }, [variant]);

  return <canvas ref={canvasRef} className={className} height={height} />;
}
