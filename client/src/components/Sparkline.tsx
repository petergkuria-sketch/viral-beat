import { motion } from "framer-motion";

export function Sparkline({
  values,
  color = "#22d3ee",
  width = 80,
  height = 32,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  const last = pts.split(" ").pop()!.split(",");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

export function ViralityBar({
  score,
  color = "#22d3ee",
}: {
  score: number;
  color?: string;
}) {
  return (
    <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden w-full">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(score, 100)}%` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}
