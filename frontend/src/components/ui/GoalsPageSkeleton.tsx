import { Skeleton } from "./Skeleton";

export function GoalsPageSkeleton() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <Skeleton width="160px" height="28px" radius="8px" />
        <Skeleton width="120px" height="32px" radius="999px" />
        <Skeleton width="100px" height="32px" radius="999px" />
      </div>
      <div style={{ flex: 1, position: "relative", minHeight: 280 }}>
        <Skeleton
          width="220px"
          height="120px"
          radius="12px"
          style={{ position: "absolute", top: "60px", left: "80px" }}
        />
        <Skeleton
          width="220px"
          height="120px"
          radius="12px"
          style={{ position: "absolute", top: "40px", left: "360px" }}
        />
        <Skeleton
          width="220px"
          height="120px"
          radius="12px"
          style={{ position: "absolute", top: "220px", left: "220px" }}
        />
      </div>
    </div>
  );
}
