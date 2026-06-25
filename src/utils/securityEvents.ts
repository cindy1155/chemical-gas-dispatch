export type SecurityEvent = {
  id: string;
  type: string;
  account: string;
  role?: string;
  message: string;
  createdAt: string;
};

const securityEventsStorageKey = "chemical-gas-dispatch-security-events";
const maxStoredSecurityEvents = 50;

export const readSecurityEvents = () => {
  try {
    const storedEvents = window.localStorage.getItem(securityEventsStorageKey);
    return storedEvents ? (JSON.parse(storedEvents) as SecurityEvent[]) : [];
  } catch {
    return [];
  }
};

export const appendSecurityEvent = (
  event: Omit<SecurityEvent, "id" | "createdAt">,
) => {
  const nextEvent: SecurityEvent = {
    ...event,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const nextEvents = [nextEvent, ...readSecurityEvents()].slice(0, maxStoredSecurityEvents);
  window.localStorage.setItem(securityEventsStorageKey, JSON.stringify(nextEvents));
  return nextEvent;
};
