import type { CSSProperties } from "react";
import "./skeleton.css";

interface SkeletonProps {
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({
  width = "100%",
  height = "16px",
  radius = "6px",
  className = "",
  style,
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}
