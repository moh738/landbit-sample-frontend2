import { Col, Row } from 'react-bootstrap';
import { useCallback, useEffect, useState } from 'react';
import UserCard from '../../../../../ui/userCard/UserCard';
import OrderInformation from './OrderInformation';
import CommonHeading from '../../../../../common/commonHeading/CommonHeading';
import './CreateOrder.scss';
import { useParams } from 'react-router-dom';
import { callGetMethod } from '../../../../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../../../../services/api.service';
import { API_ENDPOINTS } from '../../../../../../constants/apis/apiEndpoints';
import { useDispatch } from 'react-redux';
import { buildCustomUserData, parseCustomFields } from '../../../../../../helpers/user/customFields';
import { TokenDetail } from '../../../../../../interfaces/wallet/wallet';
import store from '../../../../../../redux/Store';



const CreateOrder = () => {
  const { id } = useParams();
  const dispatch=useDispatch()
  const [tokenDetails, setTokenDetails] = useState<TokenDetail>();
  const [ticker, setTicker] = useState<any>(null);
  const [investmentDetails, setInvestmentDetails] = useState<any>(null);
   const [propertyDetails, setPropertyDetails] = useState<any>(null);
  const [financialInformation, setFinancialInformation] = useState<any>(null);
   const [tokenCustomFields, setTokenCustomFields] = useState<any>(null);
   const [refreshFlag, setRefreshFlag] = useState(false);

   const handleOrderSuccess = () => {
     setRefreshFlag((prev) => !prev); 
   };

 const [userCardData] = useState([
   {
     blockchain: 'Ethereum',
     tokenSymbol: 'MCT',
     lockupPeriod: '1 Months',
     maxInvestment: '₹1,00,000',
     listingType: 'Fractionalized Property',
     totalSupply: '₹8M',
     buyBackPeriod: '6 Months',
     minInvestment: '₹10,000',
   },
 ]);

  const fetchPropertyDetails = useCallback(async () => {
    try {
      const equityEnable = store.getState().user.equityEnable;
      const res: any = await callGetMethod({
        apiUrl: landbitBackendUrl,
        endpoint: equityEnable
          ? API_ENDPOINTS.GET.EQUITY_DETAILS
          : API_ENDPOINTS.GET.PROPERTY_DETAILS,
        params: equityEnable ? { equityId: id } : { propertyId: id },
        showToaster: false,
        dispatch,
        showLoader: false,
        showButtonLoader: false,
        token: true,
      });
      if (res?.success) {
        const {
          equityData,
          tokenDetails,
          financialInfo,
          propertyDetails,
          equityDetails,
          investmentDetails,
          propertyData,
        } = res?.data;
        setTokenDetails(tokenDetails);
        setTicker(propertyData?.ticker);
        setTicker(
          equityEnable
            ? equityData?.ticker 
            : propertyData?.ticker
        );
        setTokenCustomFields(parseCustomFields(tokenDetails?.customFields));
        setFinancialInformation(financialInfo);
        setPropertyDetails(equityEnable ? equityDetails : propertyDetails);
        setInvestmentDetails(investmentDetails);
      }
    } catch (error: any) {
      console.error('Error fetching property details:', error);
    }
  }, [id, refreshFlag]);


  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
    }
  }, [fetchPropertyDetails, id]);



  return (
    <>
      <section className="create_order">
        <CommonHeading heading="Create Order" />
        <div className="create_order_inner">
          <Row className="create_order_inner_row">
            <Col lg={8}>
              <div className="create_order_inner_left">
                <OrderInformation
                  propertyDetails={propertyDetails}
                  tokenDetails={tokenDetails}
                  financialInfo={financialInformation}
                  onOrderSuccess={handleOrderSuccess}
                  tickers={ticker}
                  investmentDetails={investmentDetails}
                />
              </div>
            </Col>
            <Col lg={4}>
              <div className="create_order_inner_right">
                {userCardData?.map((data, index) => (
                  <UserCard
                    key={index}
                    {...data}
                    tokenDetails={tokenDetails}
                    marketPlaceActiveTab={tokenDetails?.listingType}
                    tokenCustomFields={buildCustomUserData(tokenCustomFields)}
                    financialInfo={financialInformation}
                    propertyDetails={propertyDetails}
                    investmentDetails={investmentDetails}
                     tickers={ticker}
                  />
                ))}
              </div>
            </Col>
          </Row>
        </div>
      </section>
    </>
  );
};

export default CreateOrder;
