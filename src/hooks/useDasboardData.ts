import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { landbitBackendUrl } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';
import { callGetMethod } from '../redux/Actions/api.action';
import { loader } from '../redux/Slices/loader.slice';
import Toast from '../components/common/Toast';
import {
  GraphData,
  GraphDataPoint,
  GraphFilter,
  GraphStats,
} from '../interfaces/dashboard/dashboardGraph';

function pickNumeric(
  row: Record<string, unknown>,
  keys: string[]
): number {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
}

function normalizeGraphPayload(raw: unknown): GraphData | null {
  if (raw == null) return null;

  let rows: unknown[] = [];
  let stats: GraphStats | undefined;

  if (Array.isArray(raw)) {
    rows = raw;
  } else if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.graphData)) rows = o.graphData;
    else if (Array.isArray(o.data)) rows = o.data;
    if (o.stats && typeof o.stats === 'object') {
      stats = o.stats as GraphStats;
    }
  }

  if (!rows.length) return null;

  const graphData: GraphDataPoint[] = rows.map((row, index) => {
    const r = (row && typeof row === 'object'
      ? (row as Record<string, unknown>)
      : {}) as Record<string, unknown>;

    const rawDate =
      typeof r.date === 'string'
        ? r.date
        : typeof r.timestamp === 'string'
          ? r.timestamp
          : '';
    let displayDate = '';
    if (rawDate) {
      const d = new Date(rawDate);
      displayDate = Number.isNaN(d.getTime())
        ? rawDate
        : format(d, 'dd MMM');
    } else if (r.id != null && String(r.id).trim() !== '') {
      displayDate = String(r.id);
    } else {
      displayDate = String(index + 1);
    }

    const current = pickNumeric(r, [
      'currentValuation',
      'current',
      'value',
      'amount',
      'totalAmount',
    ]);
    const invested = pickNumeric(r, [
      'newValuation',
      'invested',
      'investedValue',
      'investedAmount',
    ]);

    return {
      date: displayDate,
      amount: current,
      currentValuation: current,
      newValuation: invested,
    };
  });

  const last = graphData[graphData.length - 1];
  return {
    graphData,
    stats:
      stats ??
      ({
        totalAmount: last?.amount ?? 0,
        fractionalAmount: 0,
        fullAmount: 0,
      } as GraphStats),
  };
}

export const useDashboardData = () => {
  const dispatch = useDispatch();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);




  const fetchDashboardDetails = useCallback(async () => {
    try {
      const res: any = await callGetMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.GET.DASHBOARD_DATA,
        params: {},
        showToaster: false,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
        token: true,
      });
      return res;
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    } finally {
      dispatch(loader(false));
    }
  }, [dispatch]);


  const fetchGraphData = useCallback(
    async (filter: GraphFilter = '1 Week') => {
      try {
         setGraphLoading(true);
        const response = await callGetMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.GET.DASHBOARD_USER_GRAPH,
          params: { filter },
          showToaster: false,
          dispatch,
          showLoader: false,
          showButtonLoader: false,
          token: true,
        });

        if (response?.success) {
          const normalized = normalizeGraphPayload(response.data);
          setGraphData(normalized);
        } else {
          setGraphData(null);
          if (response?.message) {
            Toast.error(response?.message || 'Failed to fetch graph data.');
          }
        }
      } catch (err: any) {
        setGraphData(null);
        console.error('Graph API error:', err);
        Toast.error(err?.message || 'Failed to fetch graph data.');
      } finally {
        setGraphLoading(false);
      }
    },
    [dispatch]
  );

  return { fetchDashboardDetails, fetchGraphData, graphLoading, graphData };
};
