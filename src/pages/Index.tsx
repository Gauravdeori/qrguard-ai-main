import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Zap } from "lucide-react";
import QRScanner from "@/components/QRScanner";
import ManualInput from "@/components/ManualInput";
import AnalysisResultCard from "@/components/AnalysisResult";
import ScanHistory from "@/components/ScanHistory";
import StatsBar from "@/components/StatsBar";
import { analyzeUrl, fetchDomainInfo, type AnalysisResult } from "@/lib/urlAnalyzer";

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  const handleScan = useCallback(async (url: string) => {
    setIsAnalyzing(true);
    setCurrentResult(null);

    // Simulate network delay for realism
    await new Promise((r) => setTimeout(r, 1200));

    const result = await analyzeUrl(url);
    setCurrentResult(result);
    setHistory((prev) => [result, ...prev].slice(0, 50));
    setIsAnalyzing(false);

    // Fetch real domain info in background
    fetchDomainInfo(result.details.domain).then((domainInfo) => {
      if (domainInfo) {
        const updatedResult = {
          ...result,
          details: {
            ...result.details,
            domainAge: domainInfo.domainAge || "Unknown",
            domainInfo,
          },
        };
        setCurrentResult(updatedResult);
        setHistory((prev) =>
          prev.map((r) => (r.timestamp === result.timestamp ? updatedResult : r))
        );
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="scanline pointer-events-none fixed inset-0 z-50" />



      {/* Main */}
      <main className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
        <StatsBar history={history} />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <QRScanner onScan={handleScan} isAnalyzing={isAnalyzing} />
            <ManualInput onSubmit={handleScan} isAnalyzing={isAnalyzing} />
          </div>

          <div className="space-y-6">
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 rounded-lg border border-primary/30 bg-card p-8"
              >
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
                <p className="text-sm text-muted-foreground">Analyzing URL for threats...</p>
              </motion.div>
            )}

            {currentResult && !isAnalyzing && (
              <AnalysisResultCard result={currentResult} />
            )}

            <ScanHistory history={history} onSelect={setCurrentResult} onClear={() => setHistory([])} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
