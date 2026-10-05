import crypto from "node:crypto";

import type {
  CalculationRepository,
  NewStoredCalculation,
  StoredCalculation,
} from "../../server/repositories/calculation.repository.js";

export class InMemoryCalculationRepository
  implements CalculationRepository
{
  readonly records: StoredCalculation[] = [];
  private sequence = 0;

  async createCalculation(input: NewStoredCalculation) {
    this.sequence += 1;
    const calculation: StoredCalculation = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date(Date.UTC(2026, 9, 3, 0, 0, this.sequence)),
    };

    this.records.push(calculation);
    return calculation;
  }

  async listCalculationsByUser(userId: string, limit: number, offset: number) {
    const ownedRecords = this.records
      .filter((calculation) => calculation.userId === userId)
      .sort(
        (left, right) =>
          right.createdAt.getTime() - left.createdAt.getTime() ||
          right.id.localeCompare(left.id),
      );

    return {
      items: ownedRecords.slice(offset, offset + limit),
      total: ownedRecords.length,
    };
  }
}
