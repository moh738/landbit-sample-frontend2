import { KYCStatus } from '../../interfaces/responses/types';

/* ========== Sumsub wireSumsubEvents – full implementation commented (manual KYC used). Uncomment to restore. ==========
import snsWebSdk from '@sumsub/websdk';
import { EventName } from '../../interfaces/onboarding/onboardingTypes';

export function wireSumsubEvents(
  builder: ReturnType<typeof snsWebSdk.init>,
  onMessage?: (type: EventName, payload: unknown) => void,
  onError?: (err: unknown) => void
) {
  const safeOn = <E extends EventName>(evt: E, handler: (payload?: unknown) => void) => builder.on(evt, handler as any);
  safeOn('idCheck.onReady', () => onMessage?.('idCheck.onReady', null));
  safeOn('idCheck.onInitialized', () => onMessage?.('idCheck.onInitialized', null));
  safeOn('idCheck.onStepCompleted', (p) => onMessage?.('idCheck.onStepCompleted', p));
  safeOn('idCheck.onApplicantSubmitted', () => onMessage?.('idCheck.onApplicantSubmitted', null));
  safeOn('idCheck.onApplicantStatusChanged', (p) => onMessage?.('idCheck.onApplicantStatusChanged', p));
  safeOn('idCheck.onResize', (p) => onMessage?.('idCheck.onResize', p));
  safeOn('idCheck.onError', (err) => onError?.(err));
}
========== End Sumsub wireSumsubEvents (commented) ========== */

export function wireSumsubEvents(_builder: any, _onMessage?: any, _onError?: any) {
  /* Sumsub SDK disabled – manual KYC flow used. See commented block above to restore. */
}

export function getAlertClassName(status: KYCStatus) {
  switch (status) {
    case 'Initialised':
      return 'incomplete_alert_blue';
    case 'Pending':
      return 'incomplete_alert_orange';
    case 'Rejected':
      return 'incomplete_alert_dark_red';
    case null:
      return 'incomplete_alert_red';
  }
}

/** Matches KycOnboardingEntry: Indian individual users use Protean domestic KYC. */
export function isProfileIndianProteanKyc(country: string | null | undefined): boolean {
  if (!country || typeof country !== 'string') return false;
  const value = country.trim().toLowerCase();
  if (!value) return false;
  if (value === 'in' || value === 'ind' || value === 'indian') return true;
  if (value.includes('india')) return true;
  return false;
}
