/**
 * Compares two folder names naturally, sorting leading/embedded numbers numerically.
 * E.g. "6 - E. Hehir" before "11 - F. Ulrick" before "Coach - M. Davies".
 */
export function sortFoldersNaturally<T extends { name: string }>(folders: T[]): T[] {
    return [...folders].sort((a, b) => {
        const numA = extractLeadingNumber(a.name);
        const numB = extractLeadingNumber(b.name);

        // If both have leading numbers, sort numerically
        if (numA !== null && numB !== null) {
            if (numA !== numB) return numA - numB;
        } else if (numA !== null) {
            // Folders with numbers come before non-numbered folders
            return -1;
        } else if (numB !== null) {
            return 1;
        }

        // Natural alphabetical sorting with numeric sensitivity
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    });
}

function extractLeadingNumber(str: string): number | null {
    const match = str.match(/^\s*(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}
