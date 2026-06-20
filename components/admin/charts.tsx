import React from "react";

interface ChartDataPoint {
  date: string;
  count: number;
}

interface ChartProps {
  data: ChartDataPoint[];
  title: string;
  color?: "indigo" | "emerald" | "amber" | "rose";
  valuePrefix?: string;
}

export function SVGLineChart({ data, title, color = "indigo", valuePrefix = "" }: ChartProps) {
  const width = 500;
  const height = 200;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center border border-zinc-800 rounded-xl bg-zinc-900/20 text-xs text-zinc-500">
        No telemetry data available for this chart.
      </div>
    );
  }

  const values = data.map((d) => d.count);
  const maxVal = Math.max(...values, 5); // Fallback to at least 5 for empty values

  // Map color palette
  const strokeColor = {
    indigo: "#6366f1",
    emerald: "#10b981",
    amber: "#f59e0b",
    rose: "#f43f5e",
  }[color];

  const gradientId = `grad-${color}-${title.replace(/\s+/g, "-").toLowerCase()}`;

  // Calculate points
  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1 || 1)) * chartWidth;
    const y = paddingTop + (1 - d.count / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ""
  );

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : "";

  return (
    <div className="p-5 border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur-md space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{title}</h4>
        <span className="text-[10px] font-mono text-zinc-500">Last 7 Days</span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + ratio * chartHeight;
            const val = Math.round(maxVal * (1 - ratio));
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  fill="#71717a"
                  fontSize="8"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {valuePrefix}
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

          {/* Chart line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#09090b"
                stroke={strokeColor}
                strokeWidth="2"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="7"
                fill={strokeColor}
                opacity="0"
                className="hover:opacity-20 transition-opacity"
              />
            </g>
          ))}

          {/* X axis dates */}
          {points.map((p, i) => {
            // Show first, middle, last to avoid crowding
            if (i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1) {
              const formattedDate = new Date(p.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
              return (
                <text
                  key={i}
                  x={p.x}
                  y={height - 10}
                  fill="#71717a"
                  fontSize="8"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {formattedDate}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>
    </div>
  );
}

export function SVGBarChart({ data, title, color = "emerald", valuePrefix = "" }: ChartProps) {
  const width = 500;
  const height = 200;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center border border-zinc-800 rounded-xl bg-zinc-900/20 text-xs text-zinc-500">
        No telemetry data available for this chart.
      </div>
    );
  }

  const values = data.map((d) => d.count);
  const maxVal = Math.max(...values, 5);

  const barColor = {
    indigo: "#6366f1",
    emerald: "#10b981",
    amber: "#f59e0b",
    rose: "#f43f5e",
  }[color];

  const barWidth = chartWidth / data.length - 6;

  return (
    <div className="p-5 border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur-md space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{title}</h4>
        <span className="text-[10px] font-mono text-zinc-500">Last 7 Days</span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + ratio * chartHeight;
            const val = Math.round(maxVal * (1 - ratio));
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  fill="#71717a"
                  fontSize="8"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {valuePrefix}
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bar Rectangles */}
          {data.map((d, i) => {
            const x = paddingLeft + i * (chartWidth / data.length) + 3;
            const barH = (d.count / maxVal) * chartHeight;
            const y = height - paddingBottom - barH;

            return (
              <g key={i} className="group">
                <rect
                  x={x}
                  y={y}
                  width={Math.max(barWidth, 4)}
                  height={Math.max(barH, 1)}
                  fill={barColor}
                  opacity="0.8"
                  rx="2"
                  className="hover:opacity-100 transition-all duration-200"
                />
                {/* Value Label on Top of Bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  fill="#d4d4d8"
                  fontSize="7"
                  textAnchor="middle"
                  fontFamily="monospace"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  {valuePrefix}
                  {d.count}
                </text>
              </g>
            );
          })}

          {/* X axis dates */}
          {data.map((d, i) => {
            if (i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) {
              const formattedDate = new Date(d.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
              const x = paddingLeft + i * (chartWidth / data.length) + barWidth / 2 + 3;
              return (
                <text
                  key={i}
                  x={x}
                  y={height - 10}
                  fill="#71717a"
                  fontSize="8"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {formattedDate}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>
    </div>
  );
}
