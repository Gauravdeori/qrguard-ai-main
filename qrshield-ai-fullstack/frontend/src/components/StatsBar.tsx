import { motion } from "framer-motion";
import { Shield, AlertTriangle, XCircle, Activity } from "lucide-react";
import type { AnalysisResult } from "@/lib/urlAnalyzer";

interface Props {
  history: AnalysisResult[];
}

const StatsBar = ({ history }: Props) => {
  const safe = history.filter(h => h.riskLevel === "safe").length;
  const suspicious = history.filter(h => h.riskLevel === "suspicious").length;
  const dangerous = history.filter(h => h.riskLevel === "dangerous").length;

  const stats = [
    { label: "Total Scans", value: history.length, icon: Activity, color: "text-primary" },
    { label: "Safe", value: safe, icon: Shield, color: "text-safe" },
    { label: "Suspicious", value: suspicious, icon: AlertTriangle, color: "text-suspicious" },
    { label: "Dangerous", value: dangerous, icon: XCircle, color: "text-dangerous" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-lg border border-border bg-card p-4 text-center"
        >
          <stat.icon className={`mx-auto mb-2 h-5 w-5 ${stat.color}`} />
          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsBar;
