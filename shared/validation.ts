import Decimal from "decimal.js";
import { z } from "zod";

export const CALCULATION_LIMITS = {
  maxAmount: 1_000_000_000_000,
  maxDecimalPlaces: 2,
} as const;

function hasSupportedDecimalPlaces(value: number) {
  return (
    new Decimal(value.toString()).decimalPlaces() <=
    CALCULATION_LIMITS.maxDecimalPlaces
  );
}

function amountSchema(label: string, options: { positive: boolean }) {
  const lowerBound = options.positive
    ? z.number().positive(`${label} harus lebih besar dari 0.`)
    : z.number().nonnegative(`${label} tidak boleh negatif.`);

  return lowerBound
    .finite(`${label} harus berupa angka yang valid.`)
    .max(
      CALCULATION_LIMITS.maxAmount,
      `${label} maksimal Rp1.000.000.000.000.`,
    )
    .refine(hasSupportedDecimalPlaces, {
      message: `${label} maksimal memiliki 2 angka desimal.`,
    });
}

export const calculationInputSchema = z
  .object({
    productPrice: amountSchema("Harga produk", { positive: false }),
    adSpend: amountSchema("Pengeluaran iklan", { positive: true }),
    costPerResult: amountSchema("Cost per Result (CPR)", { positive: true }),
    averageOrderValue: amountSchema("Nilai pesanan rata-rata", {
      positive: false,
    }),
  })
  .strict();

export const calculationRequestSchema = calculationInputSchema.strip();

export const calculationPaginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

export type ValidatedCalculationInput = z.infer<typeof calculationInputSchema>;
export type CalculationPagination = z.infer<
  typeof calculationPaginationSchema
>;
