import { Skeleton } from "./Skeleton";

export function TopPageSkeleton() {
  return (
    <div
      style={{
        width: "100%",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Skeleton width="180px" height="14px" radius="6px" />
        <Skeleton width="240px" height="28px" radius="8px" />
        <Skeleton width="320px" height="16px" radius="6px" />
      </div>
      <Skeleton width="100%" height="200px" radius="12px" />
      <Skeleton width="100%" height="160px" radius="12px" />
    </div>
  );
}
