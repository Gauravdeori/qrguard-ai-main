import { GoogleGenAI } from "@google/genai";

export interface DomainInfo {
  registrationDate: string | null;
  expirationDate: string | null;
  lastChanged: string | null;
  domainAge: string | null;
  nameservers: string[];
  registrar: string | null;
  status: string[];
}

export interface AnalysisResult {
  url: string;
  riskLevel: "safe" | "suspicious" | "dangerous";
  riskScore: number; // 0-100
  threats: string[];
  details: {
    isHttps: boolean;
    domain: string;
    domainAge: string;
    sslStatus: string;
    ipAddress: string;
    redirectCount: number;
    suspiciousPatterns: string[];
    domainInfo?: DomainInfo;
  };
  timestamp: Date;
}

const KNOWN_MALICIOUS_DOMAINS = [
  "bit.ly/malware",
  "evil-phishing.com",
  "free-prize-winner.net",
  "login-secure-update.com",
  "paypa1.com",
  "amaz0n-secure.com",
  "g00gle-verify.com",
  "faceb00k-login.net",
  "bank-secure-update.xyz",
  "crypto-free-giveaway.io",
];

const SUSPICIOUS_TLDS = [".xyz", ".top", ".club", ".work", ".buzz", ".tk", ".ml", ".ga", ".cf", ".gq"];

const PHISHING_KEYWORDS = [
  "login", "verify", "secure", "update", "confirm", "account",
  "password", "banking", "paypal", "amazon", "apple", "microsoft",
  "free", "winner", "prize", "urgent", "suspended", "limited",
];

const LEGITIMATE_DOMAINS = [
  "google.com", "github.com", "stackoverflow.com", "wikipedia.org",
  "youtube.com", "microsoft.com", "apple.com", "amazon.com",
  "linkedin.com", "twitter.com", "facebook.com", "reddit.com",
];

function extractDomain(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname;
  } catch {
    return url;
  }
}

function hasHomoglyphs(domain: string): boolean {
  const homoglyphs = /[0oO1lI]/;
  const brands = ["google", "paypal", "amazon", "apple", "facebook", "microsoft", "netflix"];
  const lower = domain.toLowerCase();
  return brands.some(b => {
    const distance = levenshtein(lower.split(".")[0], b);
    return distance > 0 && distance <= 2 && homoglyphs.test(lower);
  });
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array(n + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
      );
  return dp[m][n];
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const domain = extractDomain(url);
  const isHttps = url.startsWith("https://");

  // Calculate heuristic fallback first
  const heuristicThreats: string[] = [];
  let heuristicRiskScore = 0;
  const suspiciousPatterns: string[] = [];

  if (KNOWN_MALICIOUS_DOMAINS.some(d => url.includes(d) || domain.includes(d))) {
    heuristicThreats.push("Known malicious domain detected");
    heuristicRiskScore += 80;
  }
  const isLegit = LEGITIMATE_DOMAINS.some(d => domain === d || domain.endsWith(`.${d}`));
  if (isLegit) heuristicRiskScore = Math.max(0, heuristicRiskScore - 30);
  if (!isHttps) {
    heuristicThreats.push("Connection is not encrypted (HTTP)");
    heuristicRiskScore += 15;
  }
  if (SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld))) {
    heuristicThreats.push("Suspicious top-level domain");
    suspiciousPatterns.push("Suspicious TLD");
    heuristicRiskScore += 20;
  }
  const foundKeywords = PHISHING_KEYWORDS.filter(k => url.toLowerCase().includes(k));
  if (foundKeywords.length > 0) {
    heuristicThreats.push(`Phishing keywords detected: ${foundKeywords.join(", ")}`);
    suspiciousPatterns.push("Phishing keywords in URL");
    heuristicRiskScore += foundKeywords.length * 8;
  }
  if (hasHomoglyphs(domain)) {
    heuristicThreats.push("Possible homoglyph/typosquatting attack");
    suspiciousPatterns.push("Homoglyph characters");
    heuristicRiskScore += 35;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) {
    heuristicThreats.push("URL uses IP address instead of domain name");
    suspiciousPatterns.push("IP-based URL");
    heuristicRiskScore += 25;
  }
  if (domain.split(".").length > 4) {
    heuristicThreats.push("Excessive subdomains detected");
    suspiciousPatterns.push("Too many subdomains");
    heuristicRiskScore += 15;
  }
  if (url.length > 200) {
    const result: AnalysisResult = {
      url,
      riskLevel: 'safe',
      riskScore: 0,
      threats: [],
      details: {
        hasSSL: url.startsWith('https'),
        domain: new URL(url).hostname,
        suspiciousPatterns: [],
        domainInfo: null,
      }
    };

    try {
      const response = await fetch("http://localhost:5000/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      return data; // Return full compiled analysis from backend

    } catch (error: any) {
      console.error("Backend Analysis failed. Falling back to local heuristics.", error);

      // Minimal fallback if backend is down
      result.riskLevel = 'suspicious';
      result.riskScore = 50;
      result.threats = ["Backend unreachable. Could not perform full AI scan."];
    }

    return result;
  }

  export async function fetchDomainInfo(domain: string): Promise<DomainInfo | null> {
    try {
      // Attempt to use RDAP (Registration Data Access Protocol) which is the modern WHOIS
      // We'll use a public RDAP bootstrap server to find the real registrar infrastructure
      const response = await fetch(`https://rdap.org/domain/${domain}`);

      if (!response.ok) {
        throw new Error("RDAP query failed");
      }

      const data = await response.json();

      // Parse RDAP JSON for relevant entities
      let registrar = "Unknown Registrar";
      let registrationDate = null;
      let expirationDate = null;
      let nameservers: string[] = [];

      // Extract Registrar
      if (data.entities && Array.isArray(data.entities)) {
        const registrarEntity = data.entities.find((e: any) => e.roles && e.roles.includes("registrar"));
        if (registrarEntity && registrarEntity.vcardArray && registrarEntity.vcardArray[1]) {
          const orgIndex = registrarEntity.vcardArray[1].find((item: any) => item[0] === "fn" || item[0] === "org");
          if (orgIndex && orgIndex[3]) {
            registrar = orgIndex[3];
          }
        }
      }

      // Extract Dates
      if (data.events && Array.isArray(data.events)) {
        const regEvent = data.events.find((e: any) => e.eventAction === "registration");
        if (regEvent) registrationDate = regEvent.eventDate;

        const expEvent = data.events.find((e: any) => e.eventAction === "expiration");
        if (expEvent) expirationDate = expEvent.eventDate;
      }

      // Extract Nameservers
      if (data.nameservers && Array.isArray(data.nameservers)) {
        nameservers = data.nameservers.map((ns: any) => ns.ldhName).filter(Boolean);
      }

      // Calculate rough age if registered date exists
      let domainAge = "Unknown";
      if (registrationDate) {
        const start = new Date(registrationDate).getTime();
        const now = new Date().getTime();
        const diffYears = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 365));
        domainAge = diffYears > 0 ? `${diffYears} years` : "< 1 year";
      }

      return {
        registrationDate: registrationDate || "Unknown",
        expirationDate: expirationDate || "Unknown",
        lastChanged: new Date().toISOString(), // Fallback
        domainAge,
        nameservers: nameservers.length > 0 ? nameservers : ["Unknown"],
        registrar,
        status: data.status || ["Active"]
      };

    } catch (err) {
      console.error("Failed to fetch real domain info:", err);
      // Silent fallback if RDAP fails (some domains block public RDAP or rate limit it)
      return {
        registrationDate: "Unknown",
        expirationDate: "Unknown",
        lastChanged: "Unknown",
        domainAge: "Unknown",
        nameservers: ["Unknown"],
        registrar: "Private/Hidden",
        status: ["Unknown"]
      };
    }
  }
