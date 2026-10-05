import { describe, expect, it } from "vitest";

import {
  formatIdr,
  formatResultCount,
  formatRoi,
} from "../../shared/format.js";

describe("formatter kalkulator", () => {
  it("memformat nilai referensi positif", () => {
    expect(formatIdr("25000000.00")).toBe("Rp 25.000.000");
    expect(formatIdr("20000000.00")).toBe("Rp 20.000.000");
    expect(formatRoi("400.0000")).toBe("+400,0%");
    expect(formatResultCount("50.000000")).toBe("50");
  });

  it("membulatkan nilai referensi negatif hanya saat display", () => {
    expect(formatIdr("63829.787234042553")).toBe("Rp 63.830");
    expect(formatIdr("-1436170.212765957447")).toBe("-Rp 1.436.170");
    expect(formatRoi("-95.7446808511")).toBe("-95,7%");
    expect(formatResultCount("6.3829787234")).toBe("6");
  });

  it("tidak menampilkan tanda plus atau minus pada nilai nol", () => {
    expect(formatIdr("-0.001")).toBe("Rp 0");
    expect(formatRoi("0")).toBe("0,0%");
  });

  it("tetap presisi saat memformat integer di atas batas aman Number", () => {
    expect(formatIdr("9007199254740993")).toBe(
      "Rp 9.007.199.254.740.993",
    );
  });
});
