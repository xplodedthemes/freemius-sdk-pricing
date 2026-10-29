/**
 * A plan feature's value as the pricing page shows it: thousands separated ("1000" → "1,000") and a period
 * written as "/ month" ("300 credits per month" → "300 credits / month"; Freemius refuses "/" in values).
 *
 * @param {*} value
 *
 * @return {string}
 */
export function formatFeatureValue(value) {
  return String(value)
    .replace(/\b\d{4,}\b/g, number => Number(number).toLocaleString('en-US'))
    .replace(/\s+per\s+(day|week|month|year)\b/gi, ' / $1');
}
