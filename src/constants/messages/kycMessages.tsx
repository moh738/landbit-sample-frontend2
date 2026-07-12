import { KYCStatus, reviewRejectType } from '../../interfaces/responses/types';
import ReasonButton from '../../components/ui/inCompleteAlert/reasonButton';

export const getOnboardingMessages = (
  accountType: 'KYC' | 'KYB',
  numberOfAttempts: number,
  reason: string,
  reviewRejectType: reviewRejectType,
) => {
  console.log('rejectionReason=====>', numberOfAttempts);


  if (reviewRejectType === 'FINAL') {
    return {
      REJECTED: `Your ${accountType} has been rejected permanently. For assistance, please contact us at support@landbitt.com`,
    };
  } else
    return {
      NULL: `Please complete your ${accountType} to obtain full access and begin investing.`,
      INITIALISED:
        'Complete remaining on boarding steps to obtain full access and begin investing.' +
        getRemainingAttemptsMessage(numberOfAttempts),
      PENDING: `Your ${accountType} is sumbitted please wait for the admin approval.`,
      REJECTED: (
        <>
          Your {accountType} has been rejected.
          {numberOfAttempts < 3 && (
            <>
              {' '}
              Reason: <ReasonButton reason={reason} />{' '}
            </>
          )}
          {' ' + getRemainingAttemptsMessage(numberOfAttempts)}
        </>
      ),
      VERIFIED: '',
    };
};

export const getRemainingAttemptsMessage = (numberOfAttempts: number) => {
  switch (numberOfAttempts) {
    case 0:
      return '';
    case 1:
      return 'You have 2 attempts remaining.';
    case 2:
      return 'You have 1 attempt remaining.';
    case 3:
      return 'For assistance, please contact us at support@landbitt.com';
  }
};

export const getOnboardingButtonTitle = (_accountType?: 'KYC' | 'KYB') => {
  return {
    NULL: `Complete Onboarding`,
    INITIALISED: 'Resume',
    // PENDING: accountType === 'KYB' ? 'View' : '',
    PENDING: 'View', // Both KYC and KYB can view submitted form when pending
    REJECTED: 'Retry',
    VERIFIED: '',
  };
};

export const getKycHeading = (
  status: KYCStatus,
  reviewRejectType: reviewRejectType,
  numberOfAttempts: number,
) => {
  switch (status) {
    case 'Initialised':
      return 'Resume onboarding';
    case 'Pending':
     return 'Your KYC is pending, please wait for the approval';
    case 'Rejected':
      if (numberOfAttempts === 3) {
        return 'Your KYC has been rejected. For assistance, please contact us at support@landbitt.com';
      }
      else if (reviewRejectType === 'FINAL') {
        return 'Your KYC has been rejected permanently. For assistance, please contact us at support@landbitt.com';
      } else {
        return 'Your KYC was rejected, please retry';
      }
    case 'Verified':
      return 'Your KYC is completed';
    case null:
      return 'Complete onboarding';
  }
};