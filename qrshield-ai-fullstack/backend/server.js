import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Domain Lookup Function (Moved from Frontend)
async function fetchDomainInfo(domain) {
    try {
        const response = await fetch(`https://rdap.org/domain/${domain}`);

        if (!response.ok) {
            throw new Error("RDAP query failed");
        }

        const data = await response.json();

        let registrar = "Unknown Registrar";
        let registrationDate = null;
        let expirationDate = null;
        let nameservers = [];

        if (data.entities && Array.isArray(data.entities)) {
            const registrarEntity = data.entities.find((e) => e.roles && e.roles.includes("registrar"));
            if (registrarEntity && registrarEntity.vcardArray && registrarEntity.vcardArray[1]) {
                const orgIndex = registrarEntity.vcardArray[1].find((item) => item[0] === "fn" || item[0] === "org");
                if (orgIndex && orgIndex[3]) {
                    registrar = orgIndex[3];
                }
            }
        }

        if (data.events && Array.isArray(data.events)) {
            const regEvent = data.events.find((e) => e.eventAction === "registration");
            if (regEvent) registrationDate = regEvent.eventDate;

            const expEvent = data.events.find((e) => e.eventAction === "expiration");
            if (expEvent) expirationDate = expEvent.eventDate;
        }

        if (data.nameservers && Array.isArray(data.nameservers)) {
            nameservers = data.nameservers.map((ns) => ns.ldhName).filter(Boolean);
        }

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
            lastChanged: new Date().toISOString(),
            domainAge,
            nameservers: nameservers.length > 0 ? nameservers : ["Unknown"],
            registrar,
            status: data.status || ["Active"]
        };

    } catch (err) {
        console.error("Failed to fetch real domain info:", err);
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

// API Route for Analysis
app.post('/api/analyze-url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    const result = {
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
        // 1. Fetch Domain Info
        result.details.domainInfo = await fetchDomainInfo(result.details.domain);

        if (!process.env.GEMINI_API_KEY) {
            console.warn("API Key missing, returning heuristic data");
            return res.json(result);
        }

        // 2. AI Analysis
        const prompt = `Analyze the following URL for cybersecurity threats: "${url}".
    Consider its structure, domain, subdomains, TLDs, known phishing keywords, homoglyphs, and length.
    Provide a JSON response strictly adhering to the following structure:
    {
      "riskLevel": "safe" | "suspicious" | "dangerous",
      "riskScore": Number between 0 and 100,
      "threats": ["array of strings describing the specific threats"],
      "suspiciousPatterns": ["array of strings listing specific suspicious patterns found"]
    }
    If there are no threats, provide empty arrays.
    Only return valid JSON without markdown block formatting.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const text = response.text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const aiData = JSON.parse(text);

        result.riskLevel = aiData.riskLevel;
        result.riskScore = aiData.riskScore;
        result.threats = aiData.threats?.length ? aiData.threats : ["No threats detected"];
        result.details.suspiciousPatterns = aiData.suspiciousPatterns || [];

        res.json(result);

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: 'Failed to analyze URL', fallbackResult: result });
    }
});

app.listen(port, () => {
    console.log(`QRShield AI Backend running on http://localhost:${port}`);
});
