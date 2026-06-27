import { Loader2 } from "lucide-react";
import "./button-spinner.css";

interface ButtonSpinnerProps {
  size?: number;
}

export function ButtonSpinner({ size = 15 }: ButtonSpinnerProps) {
  return (
    <Loader2
      size={size}
      strokeWidth={1.75}
      aria-hidden
      className="btn-spinner"
    />
  );
}
