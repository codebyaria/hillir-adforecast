import Decimal from "decimal.js";

import type { CalculationInput, CalculationResult } from "../../shared/types";
import { formatIdr, formatResultCount } from "../../shared/format";

export interface CampaignInsight {
  tone: "violet" | "cyan" | "emerald" | "amber" | "rose";
  text: string;
}

function getCprInsight(
  input: CalculationInput,
  result: CalculationResult,
): CampaignInsight {
  const currentCpr = formatIdr(input.costPerResult);
  const targetCpr = formatIdr(result.targetCpr);

  if (result.isCprHealthy && result.status === "profitable") {
    return {
      tone: "cyan",
      text: `CPR ${currentCpr} berada di bawah acuan simulasi ${targetCpr}. Pertahankan level ini sambil menguji perubahan anggaran secara bertahap.`,
    };
  }

  if (result.isCprHealthy && result.status === "break_even") {
    return {
      tone: "amber",
      text: `CPR ${currentCpr} berada di bawah acuan simulasi ${targetCpr}, tetapi kampanye baru impas. Turunkan CPR agar tersedia ruang untuk biaya operasional.`,
    };
  }

  if (result.isCprHealthy) {
    return {
      tone: "amber",
      text: `CPR ${currentCpr} berada di bawah acuan simulasi ${targetCpr}, tetapi masih lebih tinggi dari nilai pesanan ${formatIdr(input.averageOrderValue)}. Turunkan CPR sebelum menambah anggaran.`,
    };
  }

  if (result.status === "profitable") {
    return {
      tone: "amber",
      text: `CPR ${currentCpr} melebihi acuan simulasi ${targetCpr}, meski proyeksi masih menguntungkan. Uji materi iklan atau segmentasi untuk memperlebar selisih keuntungan.`,
    };
  }

  if (result.status === "break_even") {
    return {
      tone: "amber",
      text: `CPR ${currentCpr} melebihi acuan simulasi ${targetCpr}. Turunkan CPR agar kampanye bergerak di atas titik impas.`,
    };
  }

  return {
    tone: "amber",
    text: `CPR ${currentCpr} melebihi acuan simulasi ${targetCpr}. Coba uji materi iklan atau segmentasi untuk menurunkannya.`,
  };
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

  const cprInsight = getCprInsight(input, result);

  const volumeSummary = `Dengan anggaran ${formatIdr(input.adSpend)}, kampanye diperkirakan menghasilkan sekitar ${formatResultCount(result.resultCount)} hasil.`;
  const marginSummary =
    result.status === "profitable"
      ? `Setiap hasil menyisakan ${formatIdr(result.marginPerResult)} setelah CPR. Gunakan angka ini sebagai baseline saat menguji skenario lain.`
      : result.status === "break_even"
        ? "Setiap hasil baru menutup CPR. Perbaiki CPR atau nilai pesanan sebelum menaikkan anggaran."
        : `Nilai pesanan per hasil masih ${formatIdr(new Decimal(result.marginPerResult).abs())} lebih rendah daripada CPR. Perbaiki selisih ini sebelum menaikkan anggaran.`;

  const volumeInsight: CampaignInsight = {
    tone: "violet",
    text: `${volumeSummary} ${marginSummary}`,
  };

  return [statusInsight, cprInsight, volumeInsight];
}
