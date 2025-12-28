// Auto-tracking feature exports

// Types
export type { IAutoTracker, TrackerRegistration, TrackerFactory, TrackerConfigNormalizer } from './types';

// Base class
export { BaseAutoTracker } from './base';

// Registry
export { AutoTrackerRegistry, autoTrackerRegistry } from './registry';

// Click tracker
export { ClickTracker, clickTrackerRegistration } from './click-tracker';
export type { AutoTrackClicksConfig, ClickEventData } from './click-tracker';
