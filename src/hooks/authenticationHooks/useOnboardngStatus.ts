import { callGetMethod } from '../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../services/api.service';
import { API_ENDPOINTS } from '../../constants/apis/apiEndpoints';
import store from '../../redux/Store';
import { setProfile } from '../../redux/Slices/user.slice';
import { CheckKYCStatusResponse } from '../../interfaces/responses/responses';
import { loader } from '../../redux/Slices/loader.slice';
import { KYCStatus } from '../../interfaces/responses/types';
import { NON_BLURRED_ROUTES } from '../../constants/modules/onBoarding/onBoardingConstants';
import { INDIVIDUAL } from '../../constants/redux/auth/authConstants';
import { hasIncompleteIndianKycDomesticSteps } from '../../interfaces/kyc/proteanKyc';
import { useCallback } from 'react';
import {
  setOnboardingStatus,
  setNumberofAttempts,
  setReason,
  setReviewRejectType,
  setVerificationSteps,
} from '../../redux/Slices/completeOnboarding.slice';

const normalizeKycStatus = (status: unknown): KYCStatus | null => {
  if (status == null) return null;
  const normalized = String(status).trim().toLowerCase();
  if (normalized === 'verified' || normalized === 'verfied') return 'Verified';
  if (normalized === 'pending') return 'Pending';
  if (normalized === 'rejected') return 'Rejected';
  if (normalized === 'initialised') return 'Initialised';
  return null;
};

export const useOnboardingStatus = () => {
  const dispatch = store.dispatch;

  const blurContent = (pathname: string, kycStatus: KYCStatus): boolean => {
    // If KYC is completed, no need to blur
    if (kycStatus === 'Verified') {
      return false;
    }

    const { verificationSteps } = store.getState().onboarding;
    const accountType = store.getState().user.profile.accountType;
    /** 3rd-party domestic flow: Pending after in-app steps — no blur (matches hidden incomplete alert). */
    if (
      kycStatus === 'Pending' &&
      (accountType ?? INDIVIDUAL) === INDIVIDUAL &&
      verificationSteps != null &&
      !hasIncompleteIndianKycDomesticSteps(verificationSteps)
    ) {
      return false;
    }

    const shouldNotBlur = NON_BLURRED_ROUTES.some((route) =>
      pathname.includes(route)
    );

    return !shouldNotBlur;
  };

  const getOnboardingStatus = useCallback(async (): Promise<KYCStatus | null> => {

    try {
      const res: CheckKYCStatusResponse = await callGetMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.GET.KYC_STATUS,
        params: {},
        showToaster: false,
        dispatch,
        showLoader: false,
        showButtonLoader: false,
        token: true,
      });

      if (res?.success) {
        const normalizedKycStatus = normalizeKycStatus(res?.data?.kycStatus);
        dispatch(setOnboardingStatus(normalizedKycStatus));
        dispatch(setReviewRejectType(res?.data?.reviewRejectType || null));
        dispatch(
          setNumberofAttempts(
            res?.data?.numberofAttempts ? res?.data?.numberofAttempts : 0
          )
        );
        dispatch(setReason(res?.data?.reason ? res?.data?.reason : ''));
        dispatch(
          setVerificationSteps(res?.data?.verificationSteps ?? null)
        );

        /** `/user/kyc/details` is the source of truth for per-step flags when present */
        try {
          const detailsRes: any = await callGetMethod({
            apiUrl: landbitBackendUrl,
            endpoint: API_ENDPOINTS.GET.GET_KYC,
            params: {},
            showToaster: false,
            dispatch,
            showLoader: false,
            showButtonLoader: false,
            token: true,
          });
          if (detailsRes?.success && detailsRes?.data?.verificationSteps) {
            dispatch(setVerificationSteps(detailsRes.data.verificationSteps));
          }
        } catch {
          /* keep steps from /user/kyc/status */
        }

        return normalizedKycStatus;
      }
      return null;
    } catch (error: any) {
      console.log('checkKYCStatus Error', error);
      return null;
    } finally {
      dispatch(loader(false));
    }
  }, [dispatch]);

  /**
   * Fetch `/user/profile` and store in Redux. Call after login/signup and again when KYC becomes `Verified` to refresh.
   */
  const getUserProfile = async () => {
    try {
      const authToken = store.getState().user.authToken;

      if (!authToken) return;

      const res = await callGetMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.GET.USER_PROFILE,
        params: {},
        showToaster: false,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
        token: true,
      });
      if (res?.success) {
        dispatch(setProfile(res?.data));
      } else {
        console.log(res?.message || 'Failed to get user profile.');
      }
    } catch (err: any) {
      console.log(err.message || 'Error fetching user profile.');
    }
  };

  return { getOnboardingStatus, getUserProfile, blurContent };
};
