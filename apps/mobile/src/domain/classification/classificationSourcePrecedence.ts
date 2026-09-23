import { ClassificationSource } from './ClassificationSource';

const SOURCE_PRECEDENCE: Record<ClassificationSource, number> = {
  [ClassificationSource.USER_OVERRIDE]: 5,
  [ClassificationSource.USER_RULE]: 4,
  [ClassificationSource.SYSTEM_DEFAULT]: 3,
  [ClassificationSource.INFERRED]: 2,
  [ClassificationSource.UNKNOWN]: 1,
};

/** Higher value wins when comparing two rules. */
export function getClassificationSourcePrecedence(
  source: ClassificationSource,
): number {
  return SOURCE_PRECEDENCE[source];
}
