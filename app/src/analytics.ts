// PostHog analytics wrapper with graceful offline/local telemetry

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: string;
}

const LOCAL_LOG_KEY = 'tc_telemetry_events';

export const analytics = {
  track: (event: string, properties?: Record<string, unknown>) => {
    try {
      const payload: AnalyticsEvent = {
        event,
        properties: {
          ...properties,
          url: typeof window !== 'undefined' ? window.location.href : '',
        },
        timestamp: new Date().toISOString(),
      };

      // Store last 100 events in localStorage for debugging & privacy-safe inspection
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const raw = localStorage.getItem(LOCAL_LOG_KEY);
          const history: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
          history.unshift(payload);
          if (history.length > 100) history.pop();
          localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(history));
        } catch {
          // ignore storage quota errors
        }
      }

      console.debug(`[Analytics Event: ${event}]`, properties);
    } catch (err) {
      console.warn('Analytics track failed:', err);
    }
  },

  getRecentEvents: (): AnalyticsEvent[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOCAL_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
};
