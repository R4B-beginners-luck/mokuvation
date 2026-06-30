import "./splash.css";
import { BrandMark } from "../BrandMark/BrandMark";

interface SplashProps {
  label?: string;
}

export default function Splash({ label = "認証を確認しています…" }: SplashProps) {
  return (
    <div className="mv-splash" role="status" aria-live="polite">
      <BrandMark size={88} animated className="mv-splash__mark" />
      <div className="mv-splash__word">
        moku<b>vation</b>
      </div>
      <span className="mv-splash__sr">{label}</span>
    </div>
  );
}
