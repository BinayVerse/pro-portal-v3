export function cleanText(input: string): string {
    // Normalize unicode, remove emojis, lowercase, normalize common abbreviations (yrs -> years),
    // strip punctuation (but keep letters/numbers/spaces), and normalize whitespace.
    if (!input) return '';

    // Unicode normalize
    let s = input.normalize('NFKC');

    // Remove emojis (common ranges)
    s = s.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDDE0-\uDDFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDDFF])/g, '');

    // Lowercase for canonicalization
    s = s.toLowerCase();

    // Normalize common abbreviations like 'yrs' -> 'years'
    s = s.replace(/\b(\d+)\s*yrs?\b/g, '$1 years');

    // Remove common leading words that don't change intent (e.g., 'for 11 years' -> '11 years')
    s = s.replace(/^(?:for|please|pls|what\s+is|what\s+are|when\s+is|whats|what's)\b\s*/i, '');

    // Remove punctuation but keep letters (all languages) and numbers and spaces
    // Uses Unicode property escapes to support non-latin scripts as well
    s = s.replace(/[^\p{L}\p{N}\s]/gu, '');

    // Normalize whitespace
    s = s.replace(/\s+/g, ' ').trim();

    return s;
}
