/**
 * String normalization helper that strips diacritics / accents.
 * E.g., "Švec" -> "svec", "Kääriäinen" -> "kaariainen"
 */
export function normalizeSearchString(str: string | null | undefined): string {
    if (!str) return "";
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

/**
 * Checks if candidate text matches query string ignoring case and accents.
 */
export function fuzzyMatch(candidate: string | null | undefined, query: string): boolean {
    if (!candidate || !query) return false;
    const normCandidate = normalizeSearchString(candidate);
    const normQuery = normalizeSearchString(query);
    return normCandidate.includes(normQuery);
}
