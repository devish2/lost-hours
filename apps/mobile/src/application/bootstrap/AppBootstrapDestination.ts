export type AppBootstrapDestination =
  | 'welcome_required'
  | 'permission_required'
  | 'ready';

export type AppBootstrapPhase =
  | 'bootstrapping'
  | 'welcome_required'
  | 'permission_required'
  | 'ready';

export function bootstrapPhaseFromDestination(
  destination: AppBootstrapDestination,
): Exclude<AppBootstrapPhase, 'bootstrapping'> {
  return destination;
}
