```
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Clock, ExternalLink, Globe, Lock, Shield, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import RiskGauge from "./RiskGauge";
export interface AnalysisResult {
  url: string;
  riskLevel: 'safe' | 'suspicious' | 'dangerous';
  riskScore: number;
  threats: string[];
  details: {
    hasSSL: boolean;
    domain: string;
    suspiciousPatterns: string[];
    domainInfo: any | null;
  };
}

interface Props {
  result: AnalysisResult;
}

const AnalysisResultCard = ({ result }: Props) => {
  const iconMap = {
    safe: <CheckCircle className="h-6 w-6 text-safe" />,
    suspicious: <AlertTriangle className="h-6 w-6 text-suspicious" />,
    dangerous: <XCircle className="h-6 w-6 text-dangerous" />,
  };

  const borderMap = {
    safe: "border-safe/30",
    suspicious: "border-suspicious/30",
    dangerous: "border-dangerous/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded - lg border - 2 ${ borderMap[result.riskLevel] } bg - card p - 6`}
    >
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <RiskGauge score={result.riskScore} level={result.riskLevel} />

        <div className="flex-1 space-y-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              {iconMap[result.riskLevel]}
              <h3 className="text-xl font-bold text-foreground">Analysis Complete</h3>
            </div>
            <p className="break-all text-sm text-muted-foreground">{result.url}</p>
          </div>

          {/* Threats */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Shield className="h-4 w-4 text-primary" /> Threat Analysis
            </h4>
            {result.threats.map((threat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-2 rounded border border-border bg-muted px-3 py-2 text-sm"
              >
                {result.riskLevel === "safe" ? (
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-suspicious" />
                )}
                <span className="text-card-foreground">{threat}</span>
              </motion.div>
            ))}
          </div>

          {/* Domain Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-terminal-darkest border border-white/5">
              <span className="flex items-center gap-2 text-sm text-terminal-muted mb-2">
                <Globe className="w-4 h-4" /> Domain
              </span>
              <p className="font-mono text-white truncate text-sm">
                {result.details.domain}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-terminal-darkest border border-white/5">
              <span className="flex items-center gap-2 text-sm text-terminal-muted mb-2">
                <Lock className="w-4 h-4" /> SSL
              </span>
              <p className={`font - mono text - sm ${
  result.details.hasSSL
    ? "text-terminal-safe"
    : "text-terminal-danger"
} `}>
                {result.details.hasSSL ? "Valid" : "Not Available"}
              </p>
            </div>
          </div>

          {result.details.domainInfo && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-terminal-darkest border border-white/5">
                  <span className="flex items-center gap-2 text-sm text-terminal-muted mb-2">
                    <Clock className="w-4 h-4" /> Domain Age
                  </span>
                  <p className="font-bold text-white text-sm">
                    {result.details.domainInfo.domainAge}
                  </p>
                  <p className="text-xs text-terminal-muted mt-1">
                    Registered: {result.details.domainInfo.registrationDate === "Unknown" ? "Unknown" : new Date(result.details.domainInfo.registrationDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-terminal-darkest border border-white/5">
                  <span className="flex items-center gap-2 text-sm text-terminal-muted mb-2">
                    Redirects
                  </span>
                  <p className="font-bold text-white text-sm">
                    Analyzed
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-terminal-darkest border border-white/5">
                <span className="block text-sm text-terminal-muted mb-2">Registrar</span>
                <p className="font-mono text-white text-sm">
                  {result.details.domainInfo.registrar || "Unknown"}
                </p>
              </div>
            </>
          )}

          {result.riskLevel === "safe" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(result.url, "_blank", "noopener,noreferrer")}
              className="border-safe/30 text-safe hover:bg-safe/10"
            >
              <ExternalLink className="mr-2 h-4 w-4" /> Open Link
            </Button>
          )}

          {result.riskLevel !== "safe" && (
            <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              ⚠️ We recommend NOT opening this link. It may be malicious.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AnalysisResultCard;
