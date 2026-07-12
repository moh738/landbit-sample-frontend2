import { useCallback, useEffect, useState } from 'react';
import { landbitBackendUrl } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';
import { axiosGetRequest } from '../services/api.service';
import { useSelector } from 'react-redux';

export const useUsdtPrice = (enabled?: boolean) => {
  const [usdtPrice, setUsdtPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const cryptoEnable = useSelector(
    (state: RootState) => state.user.profile.cryptoEnable
  );
  const shouldFetch = enabled ?? Boolean(cryptoEnable);

  const fetchUsdtPrice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res: any = await axiosGetRequest(
        landbitBackendUrl,
        API_ENDPOINTS.GET.GET_USDC_PRICE,
        {},
        false,
        true
      );

      const raw = res?.data ?? res;
      const parsed = Number(raw);

      if (!Number.isNaN(parsed) && parsed > 0) {
        setUsdtPrice(parsed);
      } else {
        setError('Unable to fetch USDT price');
      }
    } catch (err: any) {
      console.error('Error fetching USDT price:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load USDT price');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!shouldFetch) {
      setUsdtPrice(null);
      setError(null);
      setLoading(false);
      return;
    }
    fetchUsdtPrice();
  }, [shouldFetch, fetchUsdtPrice]);

  return { usdtPrice, loading, error, refreshUsdtPrice: fetchUsdtPrice };
};



