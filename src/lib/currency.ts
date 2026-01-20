/**
 * Currency Utility
 * Handles exchange rates and multi-currency conversions.
 */

// Initial mock rates - can be replaced with an external API call later
const MOCK_RATES: Record<string, number> = {
    "TRY": 1,
    "USD": 30.25,
    "EUR": 32.85,
    "GBP": 38.40,
};

export type Currencies = "TRY" | "USD" | "EUR" | "GBP";

/**
 * Fetches the latest exchange rates.
 * @returns Object with currency symbols as keys and rates relative to TRY as values.
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
    // In a real scenario, this would fetch from an API (e.g., TCMB, fixer.io)
    // For now, we return mock data
    return MOCK_RATES;
}

/**
 * Converts an amount from one currency to another.
 * @param amount The value to convert
 * @param from The source currency code (e.g., "USD")
 * @param to The target currency code (default: "TRY")
 * @param rates Optional rates object to use for conversion
 */
export function convertAmount(
    amount: number,
    from: string,
    to: string = "TRY",
    rates: Record<string, number> = MOCK_RATES
): number {
    if (from === to) return amount;

    const fromRate = rates[from.toUpperCase()] || 1;
    const toRate = rates[to.toUpperCase()] || 1;

    // Convert to TRY first, then to target
    // amount * fromRate = TRY value
    // TRY value / toRate = Target value
    return (amount * fromRate) / toRate;
}

/**
 * Formats a number as a currency string.
 */
export function formatCurrency(
    amount: number,
    currency: string = "TRY",
    locale: string = "tr-TR"
): string {
    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency.toUpperCase(),
            minimumFractionDigits: 2,
        }).format(amount);
    } catch (e) {
        return `${amount.toFixed(2)} ${currency}`;
    }
}
