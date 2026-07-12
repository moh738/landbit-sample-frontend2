import { callGetMethod } from '../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../services/api.service';
import { API_ENDPOINTS } from '../../constants/apis/apiEndpoints';
import store from '../../redux/Store';
import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { formatReferralPoints } from '../../helpers/user/maskEmail';

export const useReferralApis = () => {
    const dispatch = useDispatch();

    /**
     * get total referral delivered
     */
    const getTotalReferralDelivered = useCallback(async () => {
        try {
            const authToken = store.getState().user.authToken;

            if (!authToken) return;

            const res = await callGetMethod({
                apiUrl: landbitBackendUrl,
                endpoint: API_ENDPOINTS.GET.TOTAL_REFERRAL_DELIVERED,
                params: {},
                showToaster: false,
                dispatch,
                showLoader: true,
                showButtonLoader: false,
                token: true,
            });

            if (res?.success) {
                return res?.data;
            } else {
                console.log(res?.message || 'Failed to get total referral delivered.');
            }
        } catch (err: any) {
            console.log(err.message || 'Error fetching total referral delivered.');
        }
    }, [dispatch]);

    /**
     * get referral commission list
     */
    const getReferralCommissionList = useCallback(async (
        page: number,
        limit: number,
        filters: any,
        download: boolean = false,
    ) => {
        try {

            const authToken = store.getState().user.authToken;

            if (!authToken) return;

            const params: any = { page, limit };
            if (download) params.download = true;
            if (filters?.search?.trim())
                params.search = filters?.search.trim();
            if (filters?.startDate) {
                
                const date = new Date(filters.startDate);
                const formattedDate = date.toLocaleDateString("en-CA");
                params.startDate = formattedDate;
            }
            if (filters?.endDate) {
                const date = new Date(filters.endDate);
                const formattedDate = date.toLocaleDateString("en-CA");
                params.endDate = formattedDate;
            }

            const res = await callGetMethod({
                apiUrl: landbitBackendUrl,
                endpoint: API_ENDPOINTS.GET.REFERRAL_COMMISSION_LIST,
                params: params,
                showToaster: false,
                dispatch,
                showLoader: true,
                showButtonLoader: false,
                token: true,
            });

            if (res?.success) {
                return res?.data;
            } else {
                console.log(res?.message || 'Failed to get referral commission list.');
            }
        } catch (err: any) {
            console.log(err.message || 'Error fetching referral commission list.');
        }
    }, [dispatch]);

    /**
     * get referral history list
     */
    const getReferralHistoryList = useCallback(async (
        page: number,
        limit: number,
        filters: any,
        download: boolean = false,
    ) => {
        try {
            const authToken = store.getState().user.authToken;

            if (!authToken) return;

            const params: any = { page, limit };
            if (download) params.download = true;
            if (filters?.search?.trim())
                params.search = filters?.search.trim();
            if (filters?.startDate) {

                const date = new Date(filters.startDate);
                const formattedDate = date.toLocaleDateString("en-CA");
                params.startDate = formattedDate;
            }
            if (filters?.endDate) {
                const date = new Date(filters.endDate);
                const formattedDate = date.toLocaleDateString("en-CA");
                params.endDate = formattedDate;
            }

            const res = await callGetMethod({
                apiUrl: landbitBackendUrl,
                endpoint: API_ENDPOINTS.GET.REFERRAL_HISTORY_LIST,
                params: params,
                showToaster: false,
                dispatch,
                showLoader: true,
                showButtonLoader: false,
                token: true,
            });
            if (res?.success) {
                return res?.data;
            } else {
                console.log(res?.message || 'Failed to get referral history list.');
            }
        } catch (err: any) {
            console.log(err.message || 'Error fetching referral history list.');
        }
    }, [dispatch]);

    const downloadCSV = (fields: string[], rows: any[][], filename: string) => {
        const csvContent = [fields, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadCSV = useCallback((type: 'commission' | 'history', data: any) => {
        if (type === 'commission') {
            downloadCSV(
                ['Name', 'Email', 'Joining Date', 'Total Commission Earned'],
                data.rows.map((item: any) => [
                    item.fullName, item.email, item.createdAt,
                    formatReferralPoints(item?.referralAmount),
                ]),
                'referral_commission'
            );
        }

        if (type === 'history') {
            downloadCSV(
                ['Property Name', 'Name', 'Email', 'Transaction Type', 'Invested Amount', 'Fee(%)', 'Commission Earned', 'Points', 'Date'],
                data.rows.map((item: any) => [
                    item.property, item.fullName, item.email,
                    item.type, item.amount, item.fee,
                    formatReferralPoints(item?.earned),
                    formatReferralPoints(item?.points),
                    item.date,
                ]),
                'referral_history'
            );
        }
    }, []);


    return { getTotalReferralDelivered, getReferralCommissionList, getReferralHistoryList, handleDownloadCSV };
};
