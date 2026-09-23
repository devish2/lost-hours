/** Validates **[fromTimestamp, toTimestamp)** query bounds (epoch milliseconds). */
export function validateUsageTimeRange(
  fromTimestamp: number,
  toTimestamp: number,
): void {
  if (fromTimestamp >= toTimestamp) {
    throw new Error(
      `Invalid usage event time range: [${fromTimestamp}, ${toTimestamp}) requires fromTimestamp < toTimestamp`,
    );
  }
}
