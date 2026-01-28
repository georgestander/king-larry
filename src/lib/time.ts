export const minutesToMs = (minutes: number) => Math.max(0, minutes) * 60_000;

export const isTimeExceeded = (startedAtMs: number, timeLimitMinutes: number, nowMs: number) =>
  nowMs - startedAtMs >= minutesToMs(timeLimitMinutes);
