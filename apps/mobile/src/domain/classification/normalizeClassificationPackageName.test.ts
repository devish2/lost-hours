import {
  InvalidClassificationPackageNameError,
  normalizeClassificationPackageName,
} from './normalizeClassificationPackageName';

describe('normalizeClassificationPackageName', () => {
  it('trims surrounding whitespace and preserves package identity', () => {
    expect(normalizeClassificationPackageName(' com.snapchat.android ')).toBe(
      'com.snapchat.android',
    );
  });

  it('rejects empty and whitespace-only input', () => {
    expect(() => normalizeClassificationPackageName('')).toThrow(
      InvalidClassificationPackageNameError,
    );
    expect(() => normalizeClassificationPackageName('   ')).toThrow(
      InvalidClassificationPackageNameError,
    );
  });
});
