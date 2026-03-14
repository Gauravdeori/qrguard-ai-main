import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/urlAnalyzer";

interface Props {
  history: AnalysisResult[];
  onSelect: (result: AnalysisResult) => void;
  onClear: () => void;
}

const ScanHistory = ({ history, onSelect, onClear }: Props) => {
  if (history.length === 0) return null;

  const iconMap = {
    safe: <CheckCircle className="h-4 w-4 text-safe" />,
    suspicious: <AlertTriangle className="h-4 w-4 text-suspicious" />,
    dangerous: <XCircle className="h-4 w-4 text-dangerous" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Clock className="h-5 w-5 text-primary" />
          Scan History
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {history.length}
          </span>
        </h2>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="mr-1 h-4 w-4" /> Clear
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {history.map((item, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(item)}
            className="flex w-full items-center gap-3 rounded border border-border bg-muted p-3 text-left transition-colors hover:border-primary/30"
          >
            {iconMap[item.riskLevel]}
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">{item.details.domain}</p>
              <p className="truncate text-xs text-muted-foreground">{item.url}</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {item.riskScore}%
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default ScanHistory;
