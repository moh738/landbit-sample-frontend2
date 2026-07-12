import CommonHeading from '../../../../common/commonHeading/CommonHeading';
import { useEffect, useRef, useState } from 'react';
import CommonButton from '../../../../ui/commonButton/CommonButton';
import Toast from '../../../../common/Toast';
import { useOnboardingStatus } from '../../../../../hooks/authenticationHooks/useOnboardngStatus';
import './CompleteOnboarding.scss';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getKycHeading } from '../../../../../constants/messages/kycMessages.tsx';

/* ========== Sumsub CompleteKycOnboarding – full implementation commented (manual KYC used). Uncomment to restore. ==========
import { useDispatch, useSelector } from 'react-redux';
import { useSumsubKyc } from '../../../../../hooks/authenticationHooks/kyc/useSumsubKyc';
import { Link } from 'react-router-dom';
import { DOCUMENT_LIST } from '../../../../../constants/modules/onBoarding/onBoardingConstants';
import { setOnboardingStatus, setSumbsubEvent } from '../../../../../redux/Slices/completeOnboarding.slice';
import { BackArrowIcon } from '../../../../../assets/icons/SvgIcon';
import right_arrow from '../../../../../assets/images/icons/right_arrow.png';

const CompleteKycOnboarding = () => {
  const { onBoardingStatus, reviewRejectType, numberofAttempts } = useSelector((state: RootState) => state.onboarding);
  const [showStartExploringButton, setShowStartExploringButton] = useState(false);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { getUserProfile } = useOnboardingStatus();

  const { containerRef, destroy, isLaunching, initialiseKycToken, handleLatestOnboardingStatus } = useSumsubKyc({
    levelName: 'basic-kyc-level',
    theme: 'light',
    lang: 'en',
    showToaster: false,
    onMessage: (evt) => {
      dispatch(setSumbsubEvent(evt));
      if (evt === 'idCheck.onApplicantSubmitted' || evt === 'idCheck.onApplicantStatusChanged') {
        handleLatestOnboardingStatus(['Initialised', 'Rejected', 'Verified', 'Pending']);
      }
    },
    onError: async (err) => {
      console.error('[Sumsub] error', err);
      setShowRetryButton(true);
    },
  });

  useEffect(() => {
    const checkContainer = () => {
      if (containerRef.current && containerRef.current.children.length > 0) {
        setIsButtonEnabled(false);
      } else {
        setIsButtonEnabled(true);
      }
    };
    checkContainer();
    const observer = new MutationObserver(checkContainer);
    if (containerRef.current) observer.observe(containerRef.current, { childList: true });
    return () => observer.disconnect();
  }, [containerRef]);

  useEffect(() => {
    if (onBoardingStatus === 'Verified' || onBoardingStatus === null) setShowResetButton(false);
    else setShowResetButton(true);
    if (onBoardingStatus === 'Initialised') { setShowStartExploringButton(false); setShowRetryButton(false); }
    if (onBoardingStatus === 'Verified') { setShowStartExploringButton(true); setShowRetryButton(false); }
    if (onBoardingStatus === 'Rejected') { setShowStartExploringButton(false); setShowRetryButton(false); }
    if (onBoardingStatus === 'Pending') { setShowStartExploringButton(false); setShowRetryButton(false); }
    if (onBoardingStatus === null) { setShowStartExploringButton(false); setShowRetryButton(false); }
    getUserProfile();
  }, [onBoardingStatus, getUserProfile]);

  useEffect(() => { return () => { destroy(); }; }, [destroy]);

  const busy = isLaunching;

  return (
    <>
      <section className="completeOnboarding">
        <CommonHeading heading={getKycHeading(onBoardingStatus, reviewRejectType, numberofAttempts)} className="heading" />
        {showStartExploringButton && (
          <div className="explore_btn">
            <CommonButton title="Start Exploring" fluid onClick={() => navigate('/user/dashboard')} />
          </div>
        )}
        {showRetryButton && (
          <div className="explore_btn">
            <CommonButton title="Retry" fluid onClick={() => { initialiseKycToken(); setShowRetryButton(false); }} />
          </div>
        )}
        {reviewRejectType !== 'FINAL' && numberofAttempts < 3 && (
          <div className="kyc-card">
            {showResetButton && isButtonEnabled === false && (
              <Link to="#" className="back_link" onClick={() => { destroy(); dispatch(setOnboardingStatus(null)); }}>
                <BackArrowIcon /> Back
              </Link>
            )}
            {busy && <p>Preparing verification…</p>}
            {isButtonEnabled === true && (
              <>
                <p>Please keep one of the below documents ready:</p>
                <ul>
                  {DOCUMENT_LIST.map((item: any, index: number) => (
                    <li key={index}><img src={right_arrow} alt="arrow_icon" />{item.title}</li>
                  ))}
                </ul>
                <p className="info">Please click the button below to start the KYC process.</p>
                <div className="action">
                  <CommonButton title="Start KYC" className="kyc_btn" fluid disabled={!isButtonEnabled} onClick={() => initialiseKycToken()} />
                </div>
              </>
            )}
            <div ref={containerRef} id="sumsub-websdk-container" />
          </div>
        )}
      </section>
    </>
  );
};
========== End Sumsub CompleteKycOnboarding (commented) ========== */

const CompleteKycOnboarding = () => {
  const { onBoardingStatus, reviewRejectType, numberofAttempts } = useSelector((state: RootState) => state.onboarding);
  const [showStartExploringButton, setShowStartExploringButton] = useState(false);
  const navigate = useNavigate();
  const { getUserProfile } = useOnboardingStatus();
  const prevOnboardingStatusRef = useRef(onBoardingStatus);

  useEffect(() => {
    if (onBoardingStatus === 'Verified') {
      setShowStartExploringButton(true);
      // getUserProfile();
    } else {
      setShowStartExploringButton(false);
      getUserProfile();
    }
  }, [onBoardingStatus, getUserProfile]);

  useEffect(() => {
    if (
      prevOnboardingStatusRef.current !== 'Verified' &&
      onBoardingStatus === 'Verified'
    ) {
      Toast.success('Your KYC is completed successfully', { duration: 5000 });
    }
    prevOnboardingStatusRef.current = onBoardingStatus;
  }, [onBoardingStatus]);

  return (
    <>
      <section className="completeOnboarding">
        <CommonHeading
          heading={getKycHeading(onBoardingStatus, reviewRejectType, numberofAttempts)}
          className="heading"
        />

        {showStartExploringButton && (
          <div className="explore_btn">
            <CommonButton
              title="Start Exploring"
              fluid
              onClick={() => navigate('/user/dashboard')}
            />
          </div>
        )}
      </section>
    </>
  );
};

export default CompleteKycOnboarding;
