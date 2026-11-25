const SCIENTIFIC_AMOUNT = /^[+-]?\d+(?:[.,]\d+)?[eE][+-]?\d+$/;

export function parseKwanzas(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : Number.NaN;
    }

    const raw = String(value ?? "")
        .trim()
        .replace(/\s/g, "")
        .replace(/(?:Kz|AOA)$/i, "");
    if (!raw) return Number.NaN;

    if (SCIENTIFIC_AMOUNT.test(raw)) {
        return Number(raw.replace(",", "."));
    }

    const numeric = raw.replace(/[^\d,.-]/g, "");
    if (!numeric) return Number.NaN;

    const lastSeparator = Math.max(numeric.lastIndexOf("."), numeric.lastIndexOf(","));
    const normalized = lastSeparator >= 0 && numeric.length - lastSeparator - 1 <= 2
        ? `${numeric.slice(0, lastSeparator).replace(/[.,]/g, "")}.${numeric.slice(lastSeparator + 1)}`
        : numeric.replace(/[.,]/g, "");
    return Number(normalized);
}

export function formatKwanzas(value) {
    const amount = parseKwanzas(value);
    if (!Number.isFinite(amount)) return "—";

    return `${new Intl.NumberFormat("pt-AO", {
        maximumFractionDigits: 2,
    }).format(amount)} Kz`;
}
