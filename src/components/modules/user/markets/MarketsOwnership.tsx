import { Col, Row } from 'react-bootstrap';
import CommonCard from '../../../ui/commonCard/CommonCard';
import CommonFilter from '../../../common/commonFilter/CommonFilter';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { API_ENDPOINTS } from '../../../../constants/apis/apiEndpoints';
import { landbitBackendUrl } from '../../../../services/api.service';
import { callGetMethod } from '../../../../redux/Actions/api.action';
import debounce from 'lodash.debounce';
import CustomPagination from '../../../common/customPagination/CustomPagination';
import { limit } from '../../../../constants/modules/onBoarding/marketPlaceConstants';
import { NoRecordIcon } from '../../../../assets/icons/SvgIcon';
import './Markets.scss';
// import { TokenDetail } from '../../../../interfaces/wallet/wallet';

interface MarketsOwnershipProps {
  activeTab?: string;
}

const MarketsOwnership = ({ activeTab }: MarketsOwnershipProps) => {
  const budgetfield = [
    { value: 'ALL', label: 'All' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'CLOSED', label: 'Closed' },
  ];

  const [filterValues, setFilterValues] = useState<any>({ status: budgetfield[0] });
  const [propertyDetails, setPropertyDetails] = useState<any[]>([]);
  const [propertyID, setPropertyID] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [financialInformation, setFinancialInformation] = useState<any>({});
  const [investmentDetails, setInvestmentDetails] = useState<any>({});
  const [tokenDetails, setTokenDetails] = useState<any>({});
  const dispatch = useDispatch();
  const isFetchingRef = useRef(false);
  const equityEnable = useSelector((state: RootState) => state?.user?.equityEnable);


  const handleFilterChange = (values: any) => {
    setPage(1);
    setFilterValues(values);
  };

  const fetchProperty = useCallback(
    async (customPage = page, customFilters = filterValues) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        const params: any = { page: customPage, limit, type: activeTab, 
          equityEnable
         };

        if (customFilters?.status?.value)
          params.filter = customFilters?.status?.value || budgetfield[0];
        if (customFilters?.search?.trim())
          params.search = customFilters?.search.trim();

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
          setPropertyDetails(res?.data?.properties || []);
          setPropertyID(res?.data?.properties?.map((item: any) => item?.propertyId));
          setTotalCount(res?.data?.totalCount || 0);
        } else {
          setPropertyDetails([]);
          setTotalCount(0);
        }
      } catch (error) {
        console.error('Error fetching onboarding data:', error);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [dispatch, page, filterValues, activeTab, equityEnable]
  );

  const fetchPropertyDetails = useCallback(async () => {
    if (!Array?.isArray(propertyID) || propertyID?.length === 0) return;

    try {
      const requests = propertyID?.map((id) =>
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

      const responses = await Promise.all(requests);
      const successResults = responses?.filter((res: any) => res?.success);
      const finInfoMap: any = {};
      const invInfoMap: any = {};
      const tokenInfoMap: any = {};

      successResults?.forEach((res: any, index: number) => {
        const id = propertyID[index];
        const { financialInfo, investmentDetails, tokenDetails } =
          res?.data || {};
        finInfoMap[id] = financialInfo;
        invInfoMap[id] = investmentDetails;
        tokenInfoMap[id] = tokenDetails;
      });

      setFinancialInformation(finInfoMap);
      setInvestmentDetails(invInfoMap);
      setTokenDetails(tokenInfoMap);
    } catch (error) {
      console.error('Error fetching property details:', error);
    }
  }, [propertyID, dispatch]);

  useEffect(() => {
    if (propertyID) {
      fetchPropertyDetails();
    }
  }, [fetchPropertyDetails]);

  const debouncedFetch = useCallback(
    debounce((searchValue: string) => {
      fetchProperty(1, { ...filterValues, search: searchValue });
    }, 500),
    [fetchProperty, filterValues]
  );

  useEffect(() => {
    if (filterValues?.search !== undefined) {
      debouncedFetch(filterValues.search);
    } else {
      fetchProperty(1, filterValues);
    }
  }, [filterValues, activeTab]);


  useEffect(() => {
    fetchProperty(page, filterValues);
  }, [page, equityEnable]);


  const handlePageChange = (selected: { selected: number; }) => {
    const newPage = selected?.selected + 1;
    setPage(newPage);
  };

  return (
    <section className="marketsOwnership">
      <CommonFilter
        SearchField
        searchplaceholder="Search here"
        statusfield={budgetfield}
        onFilterChange={handleFilterChange}
        initialValues={filterValues}
        btntitle="Reset Filter"
        className="filters_space"
        btnClick={() => {
          const resetFilters = { status: budgetfield[0], search: '' };
          setFilterValues(resetFilters);
          setPage(1);
          fetchProperty(1, resetFilters);
        }}
        btnDisabled={
          filterValues?.status?.value === budgetfield[0]?.value &&
          !filterValues?.search
        }
      />
      <Row className="markets_row">
        {propertyDetails?.length > 0 ? (
          propertyDetails?.map((item, index) => (
            <Col key={index} xs={12} sm={6} lg={4} xxl={3}>
              <CommonCard
                {...item}
                primaryMarketPlaceActiveTab={activeTab}
                investmentDetails={investmentDetails[item?.propertyId]}
                tokenDetails={tokenDetails?.[item?.propertyId]}
                financialInformation={financialInformation?.[item?.propertyId]}
              />
            </Col>
          ))
        ) : (
          <div className="no_data_found">
            <NoRecordIcon />
            <p>No Property Found</p>
          </div>
        )}
      </Row>

      {totalCount > limit && (
        <CustomPagination
          handlePageChange={handlePageChange}
          pageCount={Math.ceil(totalCount / limit)}
          forcePage={page - 1}
        />
      )}
    </section>
  );
};

export default MarketsOwnership;
