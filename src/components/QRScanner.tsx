import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion } from "framer-motion";
import { Camera, CameraOff, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerProps {
  onScan: (url: string) => void;
  isAnalyzing: boolean;
}

const QRScanner = ({ onScan, isAnalyzing }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      setError("Camera access denied or not available. Try entering a URL manually.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-lg border border-border bg-card p-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <ScanLine className="h-5 w-5 text-primary" />
          QR Scanner
        </h2>
        <Button
          variant={isScanning ? "destructive" : "default"}
          size="sm"
          onClick={isScanning ? stopScanner : startScanner}
          disabled={isAnalyzing}
        >
          {isScanning ? (
            <><CameraOff className="mr-2 h-4 w-4" /> Stop</>
          ) : (
            <><Camera className="mr-2 h-4 w-4" /> Start Camera</>
          )}
        </Button>
      </div>

      <div
        ref={containerRef}
        className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-lg border border-border bg-muted"
      >
        <div id="qr-reader" className="h-full w-full" />
        {!isScanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Camera className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click "Start Camera" to scan</p>
          </div>
        )}
        {isScanning && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 h-1 bg-primary"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {error && (
        <p className="mt-3 text-center text-sm text-destructive">{error}</p>
      )}
    </motion.div>
  );
};

export default QRScanner;
