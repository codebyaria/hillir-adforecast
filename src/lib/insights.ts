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
          text: "Proyeksi kampanye menguntungkan. Pertahankan efisiensi sambil memantau kualitas hasil.",
        }
      : result.status === "break_even"
        ? {
            tone: "amber",
            text: "Proyeksi berada di titik impas. Masih diperlukan ruang margin untuk biaya operasional lain.",
          }
        : {
            tone: "rose",
            text: "Kampanye perlu dioptimasi. Fokus pada pengurangan CPR atau peningkatan nilai pesanan.",
          };

  const cprInsight: CampaignInsight = result.isCprHealthy
    ? {
        tone: "cyan",
        text: `CPR berada dalam target heuristic 30% harga produk (${formatIdr(result.targetCpr)}).`,
      }
    : {
        tone: "amber",
        text: `CPR lebih tinggi dari target heuristic ${formatIdr(result.targetCpr)}. Uji materi iklan atau segmentasi untuk menekannya.`,
      };

  const volumeInsight: CampaignInsight = {
    tone: "violet",
    text: `Dengan anggaran ${formatIdr(input.adSpend)}, estimasinya ${formatResultCount(result.resultCount)} hasil dengan margin ${formatIdr(result.marginPerResult)} per hasil.`,
  };

  return [statusInsight, cprInsight, volumeInsight];
}
