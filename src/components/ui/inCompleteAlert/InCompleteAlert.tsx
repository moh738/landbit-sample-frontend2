import { RedCrossIcon } from '../../../assets/icons/SvgIcon';
import CommonButton from '../commonButton/CommonButton';
import { useNavigate } from 'react-router-dom';
import './InCompleteAlert.scss';
import { useSelector } from 'react-redux';
import {
  INDIVIDUAL,
  INSTITUTIONAL,
} from '../../../constants/redux/auth/authConstants';
import { KYCStatus } from '../../../interfaces/responses/types';
import {
  getOnboardingButtonTitle,
  getOnboardingMessages,
} from '../../../constants/messages/kycMessages.tsx';
import { useEffect, useState } from 'react';
import {
  getAlertClassName,
} from '../../../helpers/auth/kycHelper';
import store from '../../../redux/Store.tsx';
import { ROUTES } from '../../../utils/Utils';
import {
  getIndianKycStepFromVerificationSteps,
  hasIncompleteIndianKycDomesticSteps,
} from '../../../interfaces/kyc/proteanKyc';

/**
 * Alert banner when KYC/KYB is incomplete. Button visibility and labels follow
 * the same status handling as KYB: null → Complete Onboarding, Initialised → Resume,
 * Pending → View, Rejected → Retry, Verified → alert hidden (no banner).
 */
const InCompleteAlert = ({ status }: { status: KYCStatus }) => {
  const navigate = useNavigate();

  const { accountType, country } = useSelector((state: RootState) => state.user.profile);
  const { numberofAttempts, reason, verificationSteps } = useSelector(
    (state: RootState) => state.onboarding
  );
  
  const [message, setMessage] = useState<any>('');
  const [buttonTitle, setButtonTitle] = useState('');
  const { reviewRejectType } = store.getState().onboarding;
  const normalizedCountry = (country || '').toString().trim().toLowerCase();
  const isIndianKycUser =
    normalizedCountry === 'india' || normalizedCountry === 'in';

  // // Treat undefined status (e.g. not yet loaded) as null – show complete onboarding
  // const effectiveStatus = status ?? null;

  // Reference KYB: when Verified, do not render alert (full access; no CTA needed)
  // if (effectiveStatus === 'Verified') {
  //   return null;
  // }

  useEffect(() => {
    const onboardingType = accountType === INDIVIDUAL ? 'KYC' : 'KYB';

    if (status === null) {
      setMessage(
        getOnboardingMessages(
          onboardingType,
          numberofAttempts,
          reason,
          reviewRejectType,
        ).NULL
      );
      setButtonTitle(getOnboardingButtonTitle(onboardingType).NULL);
    } else if (status === 'Initialised') {
      setMessage(
        getOnboardingMessages(
          onboardingType,
          numberofAttempts,
          reason,
          reviewRejectType,
        ).INITIALISED
      );
      setButtonTitle(getOnboardingButtonTitle(onboardingType).INITIALISED);
    } else if (status === 'Pending') {
      if (isIndianKycUser && hasIncompleteIndianKycDomesticSteps(verificationSteps)) {
        setMessage(
          `Your ${onboardingType} verification is not finished yet. Continue to complete document verification and/or face liveness.`
        );
        setButtonTitle('Continue');
      } else {
        setMessage(
          getOnboardingMessages(
            onboardingType,
            numberofAttempts,
            reason,
            reviewRejectType,
          ).PENDING
        );
        setButtonTitle(getOnboardingButtonTitle(onboardingType).PENDING);
      }
    } else if (status === 'Rejected') {
      setMessage(
        getOnboardingMessages(
          onboardingType,
          numberofAttempts,
          reason,
          reviewRejectType,
        ).REJECTED
      );
      setButtonTitle(getOnboardingButtonTitle(onboardingType).REJECTED);
    } else if (status === 'Verified') {
      setMessage(
        getOnboardingMessages(
          onboardingType,
          numberofAttempts,
          reason,
          reviewRejectType,
        ).VERIFIED
      );
      setButtonTitle(getOnboardingButtonTitle(onboardingType).VERIFIED);
    }
  }, [
    status,
    accountType,
    numberofAttempts,
    reason,
    reviewRejectType,
    verificationSteps,
    isIndianKycUser,
  ]);

  /** Domestic / 3rd-party KYC: Pending after OCR·verify·liveness is done — provider processes in background; do not show "wait for admin" banner. */
  const hidePendingThirdPartyAdminBanner =
    status === 'Pending' &&
    (accountType ?? INDIVIDUAL) === INDIVIDUAL &&
    verificationSteps != null &&
    !hasIncompleteIndianKycDomesticSteps(verificationSteps);

  if (hidePendingThirdPartyAdminBanner) {
    return null;
  }

  return (
    <div
      className={`incomplete_alert 
        ${getAlertClassName(status)}`}
    >
      <div className="incomplete_alert_text">
        <RedCrossIcon /> <p>{message} </p>{' '}
      </div>
      {/* Button shown for null/Initialised/Pending/Rejected; hidden when Verified, attempts exhausted, or final reject (reference KYB) */}
      {numberofAttempts < 3 && buttonTitle && reviewRejectType !== 'FINAL' && (
        <CommonButton
          title={buttonTitle}
          className="red"
          onClick={() => {
            const type = accountType ?? INDIVIDUAL;
            if (type === INDIVIDUAL) {
              const base = `/${ROUTES.USER}/${ROUTES.DASHBOARD}/${ROUTES.COMPLETE_KYC_ONBOARDING}`;
              /** First incomplete step from API (`ocr: false` → id_upload; `ocr: true` → doc verify / liveness). */
              const resumeStep = verificationSteps
                ? getIndianKycStepFromVerificationSteps(verificationSteps)
                : null;
              navigate(
                resumeStep ? `${base}?step=${encodeURIComponent(resumeStep)}` : base
              );
            } else if (type === INSTITUTIONAL) {
              navigate(
                `/${ROUTES.USER}/${ROUTES.DASHBOARD}/${ROUTES.COMPLETE_KYB_ONBOARDING}`
              );
            } else {
              navigate(`/${ROUTES.USER}`);
            }
          }}
        />
      )}
    </div>
  );
};
export default InCompleteAlert;
