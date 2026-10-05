import { describe, expect, it } from "vitest";

import { calculateCampaign } from "../../shared/calculation.js";
import { CALCULATION_LIMITS } from "../../shared/validation.js";

describe("calculateCampaign", () => {
  it("menghasilkan output yang sama dengan referensi UI profitable", () => {
    const result = calculateCampaign({
      productPrice: 500_000,
      adSpend: 5_000_000,
      costPerResult: 100_000,
      averageOrderValue: 500_000,
    });

    expect(result).toEqual({
      formulaVersion: "v1",
      resultCount: "50.000000",
      revenue: "25000000.00",
      profitAfterAds: "20000000.00",
      roiPercentage: "400.0000",
      targetCpr: "150000.00",
      revenuePerResult: "500000.00",
      marginPerResult: "400000.00",
      status: "profitable",
      isCprHealthy: true,
    });
  });

  it("mempertahankan presisi sebelum membulatkan skenario negatif", () => {
    const result = calculateCampaign({
      productPrice: 50_000,
      adSpend: 1_500_000,
      costPerResult: 235_000,
      averageOrderValue: 10_000,
    });

    expect(result).toEqual({
      formulaVersion: "v1",
      resultCount: "6.382979",
      revenue: "63829.79",
      profitAfterAds: "-1436170.21",
      roiPercentage: "-95.7447",
      targetCpr: "15000.00",
      revenuePerResult: "10000.00",
      marginPerResult: "-225000.00",
      status: "needs_optimization",
      isCprHealthy: false,
    });
  });

  it("mendeteksi kondisi impas tanpa negative zero", () => {
    const result = calculateCampaign({
      productPrice: 50_000,
      adSpend: 100_000,
      costPerResult: 10_000,
      averageOrderValue: 10_000,
    });

    expect(result.profitAfterAds).toBe("0.00");
    expect(result.roiPercentage).toBe("0.0000");
    expect(result.status).toBe("break_even");
  });

  it.each([
    ["ad spend nol", { adSpend: 0 }],
    ["CPR nol", { costPerResult: 0 }],
    ["harga produk negatif", { productPrice: -1 }],
    ["AOV negatif", { averageOrderValue: -1 }],
    ["angka non-finite", { adSpend: Number.POSITIVE_INFINITY }],
    ["lebih dari dua desimal", { productPrice: 10.123 }],
    [
      "melewati batas input",
      { productPrice: CALCULATION_LIMITS.maxAmount + 1 },
    ],
  ])("menolak %s", (_label, override) => {
    expect(() =>
      calculateCampaign({
        productPrice: 50_000,
        adSpend: 1_500_000,
        costPerResult: 235_000,
        averageOrderValue: 10_000,
        ...override,
      }),
    ).toThrow();
  });

  it("menghitung input besar secara deterministik tanpa Infinity", () => {
    const result = calculateCampaign({
      productPrice: CALCULATION_LIMITS.maxAmount,
      adSpend: CALCULATION_LIMITS.maxAmount,
      costPerResult: CALCULATION_LIMITS.maxAmount,
      averageOrderValue: CALCULATION_LIMITS.maxAmount,
    });

    expect(result.resultCount).toBe("1.000000");
    expect(result.revenue).toBe("1000000000000.00");
    expect(result.profitAfterAds).toBe("0.00");
    expect(Object.values(result)).not.toContain("Infinity");
  });
});
