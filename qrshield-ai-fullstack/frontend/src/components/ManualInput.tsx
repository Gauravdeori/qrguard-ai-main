import { useState } from "react";
import { motion } from "framer-motion";
import { Link, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ManualInputProps {
  onSubmit: (url: string) => void;
  isAnalyzing: boolean;
}

const ManualInput = ({ onSubmit, isAnalyzing }: ManualInputProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
      setUrl("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-lg border border-border bg-card p-4"
    >
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Link className="h-5 w-5 text-primary" />
        Manual URL Check
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a URL to analyze..."
          className="flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
        <Button type="submit" disabled={!url.trim() || isAnalyzing}>
          <Search className="mr-2 h-4 w-4" />
          Scan
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {["https://google.com", "http://paypa1.com/login", "https://free-prize-winner.net"].map((sample) => (
          <button
            key={sample}
            onClick={() => onSubmit(sample)}
            className="rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {sample}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default ManualInput;
