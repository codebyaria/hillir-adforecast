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
    expect(insights[0]).toMatchObject({ tone: "emerald" });
    expect(insights[1]?.text).toContain("Rp 150.000");
    expect(insights[2]?.text).toContain("50 hasil");
  });

  it("memberi tindakan yang transparan pada skenario negatif", () => {
    const input = {
      productPrice: 50_000,
      adSpend: 1_500_000,
      costPerResult: 235_000,
      averageOrderValue: 10_000,
    };
    const insights = getCampaignInsights(input, calculateCampaign(input));

    expect(insights[0]).toMatchObject({ tone: "rose" });
    expect(insights[0]?.text).toContain("pengurangan CPR");
    expect(insights[1]).toMatchObject({ tone: "amber" });
    expect(insights[1]?.text).toContain("heuristic");
  });
});
