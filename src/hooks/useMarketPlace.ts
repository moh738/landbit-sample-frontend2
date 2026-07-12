// hooks/useFetchProperties.ts
import { useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { callGetMethod } from '../redux/Actions/api.action';
import { landbitBackendUrl } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';

interface UseFetchPropertiesProps {
  activeTab: string;
  limit?: number;
}

interface Property {
  propertyId: string;
  title: string;
  // Add other property fields as needed
}

export const useFetchProperties = ({
  activeTab,
  limit = 10,
}: UseFetchPropertiesProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const dispatch = useDispatch();
  const equityEnable = useSelector((state: RootState) => state?.user?.equityEnable);

  const fetchProperties = useCallback(async (
    equityEnable: boolean
  ) => {
    try {
      const params = { page: 1, limit, type: activeTab, filter: 'ALL', 
        equityEnable 
      };
      const res: any = await callGetMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.GET.ALL_PROPERTY,
        params,
        showToaster: false,
        dispatch,
        showLoader: false,
        showButtonLoader: false,
        token: true,
      });

      if (res?.success) {
        setProperties(res?.data?.properties || []);
        setTotalCount(res?.data?.totalCount || 0);
      } else {
        setProperties([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      setTotalCount(0);
    }
  }, [activeTab, dispatch, limit]);

  useEffect(() => {
    fetchProperties(
      equityEnable
    );
  }, [fetchProperties, equityEnable]);

  return { properties, totalCount, refetch: fetchProperties };
};
