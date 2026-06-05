"use client";

interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  /** When true, high score = good (green). Use for health scores. */
  positive?: boolean;
}

function color(score: number, positive: boolean) {
  if (positive) {
    if (score >= 70) return "bg-emerald-100 text-emerald-700 ring-emerald-200";
    if (score >= 40) return "bg-amber-100 text-amber-700 ring-amber-200";
    return "bg-red-100 text-red-700 ring-red-200";
  }
  if (score >= 70) return "bg-red-100 text-red-700 ring-red-200";
  if (score >= 40) return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-emerald-100 text-emerald-700 ring-emerald-200";
}

const sizes = {
  sm: "text-xs px-2 py-0.5 rounded-md",
  md: "text-sm px-2.5 py-1 rounded-lg font-semibold",
  lg: "text-lg px-3 py-1.5 rounded-xl font-bold",
};

export default function ScoreBadge({ score, size = "md", label, positive = false }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 ring-1 ${color(score, positive)} ${sizes[size]}`}>
      {label && <span className="font-normal opacity-70">{label}</span>}
      {score}
    </span>
  );
}
