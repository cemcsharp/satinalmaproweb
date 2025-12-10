import { NextResponse } from "next/server";

// Cache structure
let cachedRates: {
    date: string;
    rates: Record<string, number>;
} | null = null;

// Cache duration (e.g., 1 hour)
const CACHE_DURATION = 60 * 60 * 1000;
let lastFetchTime = 0;

export async function GET() {
    try {
        const now = Date.now();

        // Return cached data if valid and fresh enough
        if (cachedRates && (now - lastFetchTime < CACHE_DURATION)) {
            return NextResponse.json(cachedRates.rates);
        }

        // Fetch from TCMB
        const response = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml");
        if (!response.ok) {
            throw new Error("TCMB service unavailable");
        }

        const xmlText = await response.text();

        // Simple regex parsing to avoid heavy XML parsers for this simple task
        // We need USD and EUR selling rates (ForexSelling)

        // Helper to extract rate
        const getRate = (code: string) => {
            const regex = new RegExp(`<Currency CrossOrder="[^"]*" Kod="${code}" CurrencyCode="${code}">[\\s\\S]*?<ForexSelling>([0-9.]+)<\/ForexSelling>`);
            const match = xmlText.match(regex);
            return match ? parseFloat(match[1]) : null;
        };

        const usdRate = getRate("USD");
        const eurRate = getRate("EUR");
        const gbpRate = getRate("GBP");

        if (!usdRate || !eurRate) {
            // Fallback to hardcoded if parsing fails completely (safety net)
            console.error("Failed to parse TCMB rates");
            return NextResponse.json({ TRY: 1, USD: 42.53, EUR: 49.58, GBP: 53.60 });
        }

        const newRates = {
            TRY: 1,
            USD: usdRate,
            EUR: eurRate,
            GBP: gbpRate || 0, // GBP might be optional
        };

        // Update cache
        cachedRates = {
            date: new Date().toISOString(),
            rates: newRates
        };
        lastFetchTime = now;

        return NextResponse.json(newRates);

    } catch (error) {
        console.error("Currency API Error:", error);
        // Return fallback in case of error
        return NextResponse.json({
            TRY: 1,
            USD: 42.53,
            EUR: 49.58,
            GBP: 53.60,
            error: "Failed to fetch live rates, using fallback"
        });
    }
}
