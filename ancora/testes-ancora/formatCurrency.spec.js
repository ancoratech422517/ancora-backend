import { expect, test } from "@playwright/test";
import { formatKwanzas, parseKwanzas } from "../src/utils/formatCurrency.js";

test("parses scientific-notation prices without changing their value", () => {
    expect(parseKwanzas("1E+1")).toBe(10);
    expect(parseKwanzas("1E+1 Kz")).toBe(10);
    expect(formatKwanzas("1E+1")).toBe("10 Kz");
});

test("formats grouped kwanza prices and rejects invalid values", () => {
    expect(parseKwanzas("10.000 Kz")).toBe(10000);
    expect(formatKwanzas("valor inválido")).toBe("—");
});
