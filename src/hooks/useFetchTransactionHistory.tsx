import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { landbitBackendUrl } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';
import { callGetMethod } from '../redux/Actions/api.action';
import { loader } from '../redux/Slices/loader.slice';

export const useFetchTransactionHistory = () => {
  const dispatch = useDispatch();
  const { cryptoEnable } = useSelector((state: RootState) => state.user.profile);

  const fetchTransactionHistory = useCallback(
    async (
      params: {
        status?: string;
        trxType?: string;
        page?: number;
        limit?: number;
        download?: boolean;
      } = {}
    ) => {
      try {
        const isCreditDebitTransaction = 
          params.trxType === 'Deposit' || 
          params.trxType === 'Withdrawal' ||
          params.trxType === 'Credit' ||
          params.trxType === 'Debit';
        const requestParams = {
          ...params,
          ...(cryptoEnable && isCreditDebitTransaction && { currency: 'USDT' }),
        };

        const res: any = await callGetMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.GET.GET_TRANSACTION_HISTORY,
          params: requestParams,
          showToaster: false,
          dispatch,
          showLoader: false,
          showButtonLoader: false,
          token: true,
        });
        return res;
      } catch (error: any) {
        console.error('Error fetching transaction history:', error);
        throw error;
      } finally {
        dispatch(loader(false));
      }
    },
    [dispatch, cryptoEnable]
  );

  return { fetchTransactionHistory };
};
