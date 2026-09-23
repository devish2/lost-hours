/** Why a session has its current classification (not UI-specific). */
export enum ClassificationSource {
  SYSTEM_DEFAULT = 'SYSTEM_DEFAULT',
  USER_RULE = 'USER_RULE',
  USER_OVERRIDE = 'USER_OVERRIDE',
  INFERRED = 'INFERRED',
  UNKNOWN = 'UNKNOWN',
}
