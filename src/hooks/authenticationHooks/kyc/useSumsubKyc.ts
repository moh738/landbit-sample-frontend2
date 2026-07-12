import { useCallback, useRef, useState } from 'react';
import { UseSumsubKycArgs } from '../../../interfaces/onboarding/onboardingTypes';

/* ========== Sumsub useSumsubKyc – full implementation commented (manual KYC used). Uncomment to restore. ==========
import { useDispatch, useSelector } from 'react-redux';
import snsWebSdk from '@sumsub/websdk';
import {
  SdkInstance,
  UseSumsubKycArgs,
} from '../../../interfaces/onboarding/onboardingTypes';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../services/api.service';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import { loader } from '../../../redux/Slices/loader.slice';
import { wireSumsubEvents } from '../../../helpers/auth/kycHelper';
import { GetKYCTokenResponse } from '../../../interfaces/responses/responses';
import Toast from '../../../components/common/Toast';
import { setKycAccessToken } from '../../../redux/Slices/completeOnboarding.slice';
import { useOnboardingStatus } from '../useOnboardngStatus';
import { KYCStatus } from '../../../interfaces/responses/types';
import { getCountryIsoCode } from '../../../utils/countryCodeUtils';

export function useSumsubKyc({
  externalUserId,
  levelName = 'basic-kyc-level',
  theme = 'light',
  lang = 'en',
  showToaster = false,
  onMessage,
  onError,
}: UseSumsubKycArgs = {}) {
  const dispatch = useDispatch();
  const { authToken, profile } = useSelector((state: RootState) => state.user);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<SdkInstance | null>(null);

  const [isLaunching, setIsLaunching] = useState(false);
  const { getOnboardingStatus } = useOnboardingStatus();

  const initialiseKycToken = useCallback(async (): Promise<any> => {
    try {
      dispatch(loader(true));
      const countryIsoCode = getCountryIsoCode(profile?.country);
      const res: GetKYCTokenResponse = await callPostMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.POST.INITIATE_KYC_SESSION,
        data: {
          country: countryIsoCode,
        },
        params: {},
        showToaster,
        dispatch,
        showLoader: false,
        showButtonLoader: false,
        token: true,
      });

      if (res?.success) {
        dispatch(loader(true));
        dispatch(setKycAccessToken(res.data.token));
        startKYC(res.data.token);
        await handleLatestOnboardingStatus(['Initialised','Rejected','Verified', 'Pending']);
      } else if (res?.success === false) {
        await getOnboardingStatus();
        dispatch(loader(false));
        Toast.error(res?.message);
      }
    } catch (error: any) {
      Toast.error(error.message);
      console.log('initialiseKycToken Error', error);
    } finally {
    }
  }, [authToken, dispatch, externalUserId, levelName, profile, showToaster]);

  const handleLatestOnboardingStatus = useCallback(
    async (statuses: KYCStatus[]) => {
      try {
        dispatch(loader(true));
        let attempts = 0;

        const intervalId = setInterval(async () => {
          attempts++;

          try {
            const onboardingStatus = await getOnboardingStatus();

            if (statuses.includes(onboardingStatus)) {
              clearInterval(intervalId);
              dispatch(loader(false));
              return;
            }

            if (attempts >= 4) {
              clearInterval(intervalId);
              dispatch(loader(false));
              Toast.error(
                'Could not get onboarding status. Please try again later.'
              );
            }
          } catch (err) {
            console.log('getOnboardingStatus Error', err);
            clearInterval(intervalId);
            dispatch(loader(false));
          }
        }, 6000);
      } catch (error: any) {
        console.log('getOnboardingStatus Error', error);
      }
    },
    [dispatch, getOnboardingStatus]
  );

  const startKYC = useCallback(
    async (accessToken: string) => {
      if (!containerRef.current) return;

      try {
        try {
          instanceRef.current?.destroy?.();
        } catch {}
        const builder = snsWebSdk
          .init(accessToken, async () => {
            const token = await initialiseKycToken();
            return token || '';
          })
          .withConf({
            theme,
            lang
          })
          .withOptions({ addViewportTag: false, adaptIframeHeight: true });

        wireSumsubEvents(builder, onMessage, onError);

        const sdk: SdkInstance = builder.build();
        sdk.launch?.(containerRef.current);
        instanceRef.current = sdk;
      } catch (e: any) {
        Toast.error(e?.message);
      } finally {
        setIsLaunching(false);
      }
    },
    [initialiseKycToken, theme, lang, profile]
  );

  const destroy = useCallback(() => {
    try {
      instanceRef.current?.destroy?.();
    } catch {}
    instanceRef.current = null;
  }, []);

  return {
    containerRef,
    startKYC,
    destroy,
    initialiseKycToken,
    isLaunching,
    handleLatestOnboardingStatus,
  };
}
========== End Sumsub useSumsubKyc (commented) ========== */

export function useSumsubKyc(_args: UseSumsubKycArgs = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLaunching] = useState(false);

  const initialiseKycToken = useCallback(async () => {}, []);
  const handleLatestOnboardingStatus = useCallback(async (_statuses: string[]) => {}, []);
  const destroy = useCallback(() => {}, []);

  return {
    containerRef,
    destroy,
    initialiseKycToken,
    isLaunching,
    handleLatestOnboardingStatus,
  };
}
