export type SdkInstance = {
  launch?: (target: HTMLElement | string) => void;
  destroy?: () => void;
};

export type LaunchTheme = 'light' | 'dark';

export type EventName =
  | 'idCheck.onReady'
  | 'idCheck.onInitialized'
  | 'idCheck.onStepCompleted'
  | 'idCheck.onApplicantSubmitted'
  | 'idCheck.onApplicantStatusChanged'
  | 'idCheck.onResize'
  | 'idCheck.onError';

export type UseSumsubKycArgs = {
  /** Optional overrides */
  externalUserId?: string;
  levelName?: string; // e.g., "basic-kyc-level"
  theme?: LaunchTheme;
  lang?: string;
  showToaster?: boolean;

  /** Optional event handlers */
  onMessage?: (type: EventName, payload: unknown) => void;
  onError?: (err: unknown) => void;
};

export interface OtpDataState {
  remainingTimeToResendOTP: number;
  blockRemainingSeconds: number;
}
