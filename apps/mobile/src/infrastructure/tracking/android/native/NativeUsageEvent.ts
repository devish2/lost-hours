/** Infrastructure transport shape from future Kotlin bridge (not domain UsageEvent). */
export interface NativeUsageEvent {
  timestamp: number;
  packageName: string;
  eventType: string;
  displayName?: string;
}
