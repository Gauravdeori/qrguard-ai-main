import { motion } from "framer-motion";

interface RiskGaugeProps {
  score: number;
  level: "safe" | "suspicious" | "dangerous";
}

const RiskGauge = ({ score, level }: RiskGaugeProps) => {
  const colorMap = {
    safe: "text-safe",
    suspicious: "text-suspicious",
    dangerous: "text-dangerous",
  };

  const bgMap = {
    safe: "bg-safe",
    suspicious: "bg-suspicious",
    dangerous: "bg-dangerous",
  };

  const glowMap = {
    safe: "glow-primary",
    suspicious: "glow-warning",
    dangerous: "glow-danger",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative h-32 w-32 rounded-full border-4 border-border ${glowMap[level]}`}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke={level === "safe" ? "hsl(var(--safe))" : level === "suspicious" ? "hsl(var(--suspicious))" : "hsl(var(--dangerous))"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 42}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - score / 100) }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-3xl font-bold ${colorMap[level]}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <span className={`rounded-full px-4 py-1 text-sm font-bold uppercase ${bgMap[level]} text-background`}>
        {level}
      </span>
    </div>
  );
};

export default RiskGauge;
