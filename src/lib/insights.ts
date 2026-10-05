import Decimal from "decimal.js";

import type { CalculationInput, CalculationResult } from "../../shared/types";
import { formatIdr, formatResultCount } from "../../shared/format";

export interface CampaignInsight {
  tone: "violet" | "cyan" | "emerald" | "amber" | "rose";
  text: string;
}

export function getCampaignInsights(
  input: CalculationInput,
  result: CalculationResult,
): CampaignInsight[] {
  const statusInsight: CampaignInsight =
    result.status === "profitable"
      ? {
          tone: "emerald",
          text: "Proyeksi kampanye menguntungkan berdasarkan biaya iklan. Pertahankan efisiensi sambil memantau kualitas hasil.",
        }
      : result.status === "break_even"
        ? {
            tone: "amber",
            text: "Proyeksi kampanye berada di titik impas. Belum ada ruang untuk menutup biaya operasional lainnya.",
          }
        : {
            tone: "rose",
            text: "Proyeksi kampanye belum menguntungkan. Kurangi CPR atau tingkatkan nilai pesanan.",
          };

  const cprInsight: CampaignInsight = result.isCprHealthy
    ? {
        tone: "cyan",
        text: `CPR Anda masih dalam acuan simulasi ${formatIdr(result.targetCpr)}, yaitu 30% dari harga produk.`,
      }
    : {
        tone: "amber",
        text: `CPR saat ini ${formatIdr(input.costPerResult)}, melebihi acuan simulasi ${formatIdr(result.targetCpr)}. Coba uji materi iklan atau segmentasi untuk menurunkannya.`,
      };

  const volumeSummary = `Dengan anggaran ${formatIdr(input.adSpend)}, kampanye diperkirakan menghasilkan sekitar ${formatResultCount(result.resultCount)} hasil.`;
  const marginSummary =
    result.status === "profitable"
      ? `Setiap hasil menyisakan ${formatIdr(result.marginPerResult)} setelah CPR, sebelum biaya operasional lainnya.`
      : result.status === "break_even"
        ? "Nilai pesanan per hasil sama dengan CPR, sehingga belum ada ruang untuk biaya operasional lainnya."
        : `Nilai pesanan per hasil masih ${formatIdr(new Decimal(result.marginPerResult).abs())} lebih rendah daripada CPR.`;

  const volumeInsight: CampaignInsight = {
    tone: "violet",
    text: `${volumeSummary} ${marginSummary}`,
  };

  return [statusInsight, cprInsight, volumeInsight];
}
