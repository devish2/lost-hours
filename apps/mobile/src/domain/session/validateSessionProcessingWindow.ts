/** Validates **[fromTimestamp, toTimestamp)** for session building (epoch ms). */
export function validateSessionProcessingWindow(
  fromTimestamp: number,
  toTimestamp: number,
): void {
  if (!Number.isFinite(fromTimestamp) || !Number.isFinite(toTimestamp)) {
    throw new Error(
      `Invalid session processing window: timestamps must be finite (got [${fromTimestamp}, ${toTimestamp}))`,
    );
  }
  if (fromTimestamp < 0 || toTimestamp < 0) {
    throw new Error(
      `Invalid session processing window: timestamps must be >= 0 (got [${fromTimestamp}, ${toTimestamp}))`,
    );
  }
  if (fromTimestamp >= toTimestamp) {
    throw new Error(
      `Invalid session processing window: [${fromTimestamp}, ${toTimestamp}) requires fromTimestamp < toTimestamp`,
    );
  }
}
