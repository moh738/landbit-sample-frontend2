import { Col, Row } from 'react-bootstrap';
import CommonCard from '../../../../ui/commonCard/CommonCard';
import TabsComponent from '../../../../ui/tabsComponent/TabsComponent';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFetchProperties } from '../../../../../hooks/useMarketPlace';
import { callGetMethod } from '../../../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../../../services/api.service';
import { API_ENDPOINTS } from '../../../../../constants/apis/apiEndpoints';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { NoRecordIcon } from '../../../../../assets/icons/SvgIcon';
import store from '../../../../../redux/Store';

const TrendingInvestments = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'FRACTIONAL';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [propertyIDs, setPropertyIDs] = useState<string[]>([]);
  const [investmentDetails, setInvestmentDetails] = useState<Record<string, any>>(
    {}
  );
  const { properties } = useFetchProperties({ activeTab, limit: 4 });
  const [tokenDetails, setTokenDetails] = useState<Record<string, any>>({});
  const hasFetchedRef = useRef<{ [key: string]: boolean }>({});

  const tabItems = [
    { key: 'FRACTIONAL', label: 'Fractional Ownership' },
    { key: 'FULL', label: 'Full Ownership' },
  ];

  const handleTabSelect = (key: string) => {
    setActiveTab(key);
    navigate(`?tab=${key}`, { replace: true });
  };

  useEffect(() => {
    const params = new URLSearchParams(location?.search);
    const tab = params?.get('tab') || 'FRACTIONAL';
    setActiveTab(tab);
  }, [location?.search]);

  

  useEffect(() => {
    if (Array?.isArray(properties) && properties?.length > 0) {
      const ids = properties?.map((p: any) => p?.propertyId)?.filter(Boolean);
      setPropertyIDs(ids);
    } else {
      setPropertyIDs([]);
    }
  }, [properties]);

  const fetchPropertyDetails = useCallback(async () => {
    if (!Array?.isArray(propertyIDs) || propertyIDs?.length === 0) return;
    if (hasFetchedRef?.current[activeTab]) return;
    hasFetchedRef.current[activeTab] = true;

    try {
      const equityEnable = store.getState().user.equityEnable;
      const requests = propertyIDs.map((id) =>
        callGetMethod({
          apiUrl: landbitBackendUrl,
          endpoint: equityEnable ? API_ENDPOINTS.GET.EQUITY_DETAILS : API_ENDPOINTS.GET.PROPERTY_DETAILS,
          params: equityEnable ? { equityId: id } : { propertyId: id },
          showToaster: false,
          dispatch,
          showLoader: false,
          showButtonLoader: false,
          token: true,
        })
      );

      const responses = await Promise?.all(requests);
      const successResults = responses?.filter((res: any) => res?.success);
      const finInfoMap: Record<string, any> = {};
      const invInfoMap: Record<string, any> = {};
      const tokenInfoMap: Record<string, any> = {};

      successResults?.forEach((res: any, index: number) => {
        const id = propertyIDs[index];
        const data = res?.data || {};
        const propertyData = data?.property || data;

        finInfoMap[id] = propertyData?.financialInfo || {};
        invInfoMap[id] = propertyData?.investmentDetails || {};
        tokenInfoMap[id] = propertyData?.tokenDetails || {};
      });
      setInvestmentDetails(invInfoMap);
      setTokenDetails(tokenInfoMap);
    } catch (error) {
      console.error('Error fetching property details:', error);
    }
  }, [propertyIDs]);

  useEffect(() => {
    if (propertyIDs?.length > 0 && !hasFetchedRef?.current[activeTab]) {
      fetchPropertyDetails();
    }
  }, [propertyIDs, fetchPropertyDetails, activeTab]);

  return (
    <div className="dashboard_investments">
      <TabsComponent
        activeTab={activeTab}
        onSelect={(key) => handleTabSelect(key ?? 'FRACTIONAL')}
        tabItems={tabItems}
        className="markets_tabs"
        showToggle
        text={"Equity Mode"}
      />

      <div className="tab_content">
        {activeTab === 'FRACTIONAL' &&
          (properties?.length > 0 ? (
            <Row className="dashboard_investments_row">
              {properties?.map((item, index) => (
                <Col key={index} xs={12} sm={6} lg={4} xxl={3}>
                  <CommonCard
                    {...item}
                    propertyId={item?.propertyId || ''}
                    primaryMarketPlaceActiveTab={activeTab}
                    investmentDetails={investmentDetails[item?.propertyId]}
                    tokenDetails={tokenDetails[item?.propertyId]}
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <div className="no_data_found">
              <NoRecordIcon />
              <p>No Property Found</p>
            </div>
          ))}
        {activeTab === 'FULL' &&
          (properties?.length > 0 ? (
            <Row className="dashboard_investments_row">
              {properties?.map((item, index) => (
                <Col key={index} xs={12} sm={6} lg={4} xxl={3}>
                  <CommonCard
                    {...item}
                    propertyId={item?.propertyId || ''}
                    primaryMarketPlaceActiveTab={activeTab}
                    investmentDetails={investmentDetails[item?.propertyId]}
                    tokenDetails={tokenDetails[item?.propertyId]}
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <div className="no_data_found">
              <NoRecordIcon />
              <p>No Property Found</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default TrendingInvestments;
