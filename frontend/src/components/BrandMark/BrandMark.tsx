import "./brand-mark.css";

interface BrandMarkProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function BrandMark({ size = 32, animated = false, className = "" }: BrandMarkProps) {
  const cls = [
    "brand-mark",
    animated ? "brand-mark--animated" : "brand-mark--static",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <svg className={cls} viewBox="0 0 96 96" width={size} height={size} aria-hidden="true">
      <path
        className="brand-mark__line"
        pathLength={100}
        d="M24 70 L48 49 L72 28"
        fill="none"
        stroke="#F4F5FF"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="brand-mark__node brand-mark__n1" cx={24} cy={70} r={8} fill="#F4F5FF" />
      <circle className="brand-mark__node brand-mark__n2" cx={48} cy={49} r={8} fill="#F4F5FF" />
      <circle className="brand-mark__node brand-mark__n3" cx={72} cy={28} r={10} />
      <path
        className="brand-mark__chk"
        d="M67 28 l3.5 3.5 l6 -7"
        fill="none"
        stroke="var(--bg-base, #16151a)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
