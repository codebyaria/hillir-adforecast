import { describe, expect, it } from "vitest";

import { calculateCampaign } from "../../shared/calculation";
import { getCampaignInsights } from "../../src/lib/insights";

describe("campaign insights", () => {
  it("menjelaskan skenario profitable dan CPR sehat", () => {
    const input = {
      productPrice: 500_000,
      adSpend: 5_000_000,
      costPerResult: 100_000,
      averageOrderValue: 500_000,
    };
    const insights = getCampaignInsights(input, calculateCampaign(input));

    expect(insights).toHaveLength(3);
    expect(insights[0]).toMatchObject({
      tone: "emerald",
      text: expect.stringContaining("menguntungkan berdasarkan biaya iklan"),
    });
    expect(insights[1]).toMatchObject({
      tone: "cyan",
      text: expect.stringContaining("di bawah acuan simulasi Rp 150.000"),
    });
    expect(insights[1]?.text).toContain("menguji perubahan anggaran secara bertahap");
    expect(insights[2]?.text).toContain("sekitar 50 hasil");
    expect(insights[2]?.text).toContain("menyisakan Rp 400.000 setelah CPR");
    expect(insights[2]?.text).toContain("baseline saat menguji skenario lain");
  });

  it("memberi tindakan yang transparan pada skenario negatif", () => {
    const input = {
      productPrice: 50_000,
      adSpend: 1_500_000,
      costPerResult: 235_000,
      averageOrderValue: 10_000,
    };
    const insights = getCampaignInsights(input, calculateCampaign(input));

    expect(insights[0]).toMatchObject({
      tone: "rose",
      text: expect.stringContaining("belum menguntungkan"),
    });
    expect(insights[1]).toMatchObject({
      tone: "amber",
      text: expect.stringContaining("CPR Rp 235.000"),
    });
    expect(insights[1]?.text).toContain("acuan simulasi Rp 15.000");
    expect(insights[2]?.text).toContain("sekitar 6 hasil");
    expect(insights[2]?.text).toContain("Rp 225.000 lebih rendah daripada CPR");
    expect(insights[2]?.text).toContain("sebelum menaikkan anggaran");
  });

  it("menjelaskan kondisi impas tanpa menyiratkan keuntungan", () => {
    const input = {
      productPrice: 500_000,
      adSpend: 1_000_000,
      costPerResult: 100_000,
      averageOrderValue: 100_000,
    };
    const insights = getCampaignInsights(input, calculateCampaign(input));

    expect(insights[0]).toMatchObject({
      tone: "amber",
      text: expect.stringContaining("berada di titik impas"),
    });
    expect(insights[1]).toMatchObject({ tone: "amber" });
    expect(insights[1]?.text).toContain("kampanye baru impas");
    expect(insights[1]?.text).toContain("Turunkan CPR");
    expect(insights[2]?.text).toContain("Setiap hasil baru menutup CPR");
    expect(insights[2]?.text).toContain("sebelum menaikkan anggaran");
  });

  it("tidak menyebut CPR aman saat acuan terpenuhi tetapi kampanye rugi", () => {
    const input = {
      productPrice: 2_450_000,
      adSpend: 11_900_000,
      costPerResult: 700_000,
      averageOrderValue: 500_000,
    };
    const insights = getCampaignInsights(input, calculateCampaign(input));

    expect(insights[0]).toMatchObject({ tone: "rose" });
    expect(insights[1]).toMatchObject({
      tone: "amber",
      text: expect.stringContaining("di bawah acuan simulasi Rp 735.000"),
    });
    expect(insights[1]?.text).toContain("lebih tinggi dari nilai pesanan Rp 500.000");
    expect(insights[1]?.text).toContain("Turunkan CPR sebelum menambah anggaran");
  });

  it("tetap menyarankan efisiensi saat CPR di atas acuan tetapi proyeksi untung", () => {
    const input = {
      productPrice: 100_000,
      adSpend: 1_000_000,
      costPerResult: 40_000,
      averageOrderValue: 100_000,
    };
    const insights = getCampaignInsights(input, calculateCampaign(input));

    expect(insights[0]).toMatchObject({ tone: "emerald" });
    expect(insights[1]).toMatchObject({
      tone: "amber",
      text: expect.stringContaining("melebihi acuan simulasi Rp 30.000"),
    });
    expect(insights[1]?.text).toContain("proyeksi masih menguntungkan");
    expect(insights[1]?.text).toContain("memperlebar selisih keuntungan");
  });
});
