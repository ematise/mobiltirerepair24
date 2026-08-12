const STATE_TIMEZONES: Record<string, string> = {
  TX: 'America/Chicago',
  FL: 'America/New_York',
  CA: 'America/Los_Angeles',
  AZ: 'America/Phoenix',
  GA: 'America/New_York',
  NY: 'America/New_York',
  IL: 'America/Chicago',
  NC: 'America/New_York',
};

export function timezoneForStateCode(stateCode: string): string {
  return STATE_TIMEZONES[stateCode.toUpperCase()] ?? 'America/Chicago';
}
