import Decimal from "decimal.js";

type DecimalValue = Decimal.Value;

const wholeNumberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
  useGrouping: true,
});

function roundedWholeNumber(value: DecimalValue) {
  return new Decimal(value)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toFixed(0);
}

export function formatIdr(value: DecimalValue) {
  const rounded = new Decimal(roundedWholeNumber(value));
  const sign = rounded.isNegative() && !rounded.isZero() ? "-" : "";
  const magnitude = BigInt(rounded.absoluteValue().toFixed(0));

  return `${sign}Rp ${wholeNumberFormatter.format(magnitude)}`;
}

export function formatRoi(value: DecimalValue) {
  const rounded = new Decimal(value).toDecimalPlaces(1, Decimal.ROUND_HALF_UP);
  const sign = !rounded.isZero() && rounded.isPositive() ? "+" : "";
  const localizedValue = rounded.toFixed(1).replace(".", ",");

  return `${sign}${localizedValue}%`;
}

export function formatResultCount(value: DecimalValue) {
  const rounded = BigInt(roundedWholeNumber(value));

  return wholeNumberFormatter.format(rounded);
}
