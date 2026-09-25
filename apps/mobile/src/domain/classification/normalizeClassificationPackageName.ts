export class InvalidClassificationPackageNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidClassificationPackageNameError';
  }
}

/** Trims whitespace; rejects empty package names for app-level classification rules. */
export function normalizeClassificationPackageName(input: string): string {
  const normalized = input.trim();
  if (normalized.length === 0) {
    throw new InvalidClassificationPackageNameError(
      'Package name is required for app classification',
    );
  }
  return normalized;
}
