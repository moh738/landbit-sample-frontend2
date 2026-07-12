import { Col, Row } from 'react-bootstrap';
import Gallery from './Gallery';
import { useCallback, useEffect, useState } from 'react';
import UserCard from '../../../../ui/userCard/UserCard';
import CommonHeading from '../../../../common/commonHeading/CommonHeading';
import { LocationIcon } from '../../../../../assets/icons/SvgIcon';
import TabsComponent from '../../../../ui/tabsComponent/TabsComponent';
import PropertyDetail from './propertyDetail/PropertyDetail';
import DocumentDetail from './documentDetail/DocumentDetail';
import '.././Markets.scss';
import { callGetMethod } from '../../../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../../../services/api.service';
import { API_ENDPOINTS } from '../../../../../constants/apis/apiEndpoints';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { MAX_LENGTH_READ_MORE_DESCRIPTION } from '../../../../../constants/modules/onBoarding/marketPlaceConstants';
import { formatCurrencyWithCrypto } from '../../../../../helpers/user/maskEmail';
import { useUsdtPrice } from '../../../../../hooks/useUsdtPrice';
import {
  buildCustomUserData,
  parseCustomFields,
} from '../../../../../helpers/user/customFields';
import store from '../../../../../redux/Store';
import UserCardEquity from '../../../../ui/userCard/UserCardEquity';

const MarketsDetail = () => {
  const [activeTab, setActiveTab] = useState('property');
  const [propertyDetails, setPropertyDetails] = useState<any>(null);
  const [ticker, setTicker] = useState<any>(null);
  const [financialInfo, setFinancialInfo] = useState<any>(null);
  const [tokenDetails, setTokenDetails] = useState<any>(null);
  const [investmentDetails, setInvestmentDetails] = useState<any>(null);
  const [legalDocuments, setLegalDocuments] = useState<any>(null);
  const [propertyCustomFields, setPropertyCustomFields] = useState<any>(null);
  const [financialCustomFields, setFinancialCustomFields] = useState<any>(null);
  const [tokenCustomFields, setTokenCustomFields] = useState<any>(null);
  const [legalCustomFields, setLegalCustomFields] = useState<any>(null);
  const [isReadMore, setIsReadMore] = useState(true);
  const { id } = useParams();
  const dispatch = useDispatch();
  const equityEnable = store.getState().user.equityEnable;
  const cryptoEnable = store.getState().user.profile.cryptoEnable;
  const { usdtPrice } = useUsdtPrice();
  const tabItems = [
    { key: 'property', label: equityEnable ? 'Equity Details' : 'Property Details' },
    { key: 'info', label: 'Financial Info' },
    { key: 'document', label: 'Legal Document' },
  ];

  const buildCustomFieldsData = (fields: any) => {
    if (!fields) return [];
    if (Array.isArray(fields)) {
      return fields
        ?.map((field: any) => {
          if (typeof field === 'object' && field !== null) {
            const title = field?.name || field?.label || field?.title || '-';
            let subTitle = '-';

            if (field?.value !== null && field.value !== undefined) {
              if (typeof field.value === 'object' && !Array.isArray(field.value)) {
                const valueObj = field?.value as Record<string, any>;
                subTitle =
                  valueObj?.value ||
                  valueObj?.label ||
                  valueObj?.name ||
                  JSON.stringify(field?.value);
              } else if (Array.isArray(field?.value)) {
                subTitle = field?.value
                  ?.map((v: any) => {
                    if (typeof v === 'object' && v !== null) {
                      const vObj = v as Record<string, any>;
                      return (
                        vObj?.value || vObj?.label || vObj?.name || JSON.stringify(v)
                      );
                    }
                    return String(v);
                  })
                  .join(', ');
              } else {
                subTitle = String(field.value);
              }
            }

            return {
              title,
              subTitle: subTitle || '-',
            };
          }
          return null;
        })
        ?.filter(Boolean);
    }
    return Object?.entries(fields)?.map(([key, value]) => {
      let subTitle = '-';
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          const valueObj = value as Record<string, any>;
          subTitle =
            valueObj?.value ||
            valueObj?.label ||
            valueObj?.name ||
            JSON.stringify(value);
        } else if (Array.isArray(value)) {
          subTitle = value
            ?.map((v: any) => {
              if (typeof v === 'object' && v !== null) {
                const vObj = v as Record<string, any>;
                return vObj?.value || vObj?.label || vObj?.name || JSON.stringify(v);
              }
              return String(v);
            })
            .join(', ');
        } else {
          subTitle = String(value);
        }
      }

      return {
        title: key,
        subTitle: subTitle || '-',
      };
    });
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

  const formatDate = (date?: string | null) =>
    date
      ? new Date(date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '-';

  // const toINR = (v: any) => `₹${Number(v)?.toLocaleString('en-IN')}`;

  const addField = (title: any, value: any, formatter?: (v: any) => string) => {
    if (value === null || value === undefined || value === '') return null;

    // Handle case where value is an object
    let subTitle: any = value;
    if (typeof value === 'object' && !Array.isArray(value) && formatter) {
      // If formatter is provided, use it
      subTitle = formatter(value);
    } else if (typeof value === 'object' && !Array.isArray(value) && !formatter) {
      // If no formatter and value is an object, extract meaningful string
      subTitle = value.value || value.label || value.name || JSON.stringify(value);
    } else if (formatter) {
      // Use formatter if provided
      subTitle = formatter(value);
    }

    // Ensure subTitle is always a string or primitive
    if (typeof subTitle === 'object' && subTitle !== null) {
      subTitle = String(subTitle);
    }

    return {
      title,
      subTitle: subTitle || '-',
    };
  };

  const propertyData = equityEnable
    ? [
        addField('Equity Name', propertyDetails?.equityName),
        // addField('Over View', propertyDetails?.overview),
        addField('Equity Type', propertyDetails?.equityType),
        addField('CIN / LLPIN', propertyDetails?.cinOrLlpin),
        addField('Registered Address', propertyDetails?.registeredAddress),
        addField('Location', propertyDetails?.location),
        addField('City', propertyDetails?.city),
        addField('Landmark', propertyDetails?.landmark),
        addField('PAN Number', propertyDetails?.panNumber),
        addField('Start Date', propertyDetails?.startDate, (v) => formatDate(v)),
        addField('Litigation', propertyDetails?.litigation),
        addField('Loan', propertyDetails?.loan),
        addField('Tenant', propertyDetails?.tenant),
        addField('Industry / Sector', propertyDetails?.industrySector),
        addField('Share Holder Name', propertyDetails?.shareHolderName),
        addField('Company Website', propertyDetails?.companyWebsite),
        ...buildCustomFieldsData(propertyCustomFields),
      ].filter(Boolean)
    : [
        addField('Property Type', propertyDetails?.propertyType),
        addField('Registered Address', propertyDetails?.registeredAddress),
        addField('Location', propertyDetails?.location),

        addField('Plot Area', propertyDetails?.plotArea, (v) => `${v} sq.ft`),
        addField('Carpet Area', propertyDetails?.carpetArea, (v) => `${v} sq.ft`),

        addField('Landmark', propertyDetails?.landmark),
        addField('Tenents', propertyDetails?.tenantStatus),
        addField('Ownership Type', propertyDetails?.ownershipMode),

        addField('Start Date', propertyDetails?.startDate, (v) => formatDate(v)),

        addField('Current Owner', propertyDetails?.currentOwner),
        addField('Previous Owner', propertyDetails?.previousOwner),

        addField('Loan Obligation', propertyDetails?.loanObligations ? 'Yes' : 'No'),
        addField(
          'Litigation Status',
          propertyDetails?.litigationStatus ? 'Yes' : 'No'
        ),

        addField('Registration Number', propertyDetails?.propertyRegistrationNumber),
        addField(
          'RERA Registration Number',
          propertyDetails?.reraRegistrationNumber
        ),
        addField(
          'Property Registration Number',
          propertyDetails?.propertyRegistrationNumber
        ),
        addField('Developer/Builder Name', propertyDetails?.developerName),

        ...buildCustomFieldsData(propertyCustomFields),
      ].filter(Boolean);

  const infoData = equityEnable
    ? [
        addField('Company Valuation', financialInfo?.companyValuation, (v) =>
          formatCurrencyWithCrypto(v, usdtPrice, cryptoEnable)
        ),
        addField('Expected ROI', financialInfo?.expectedRoi, (v) => `${v}%`),
        addField(
          'Rental Yield per Annum',
          financialInfo?.rentalYield,
          (v) => `${v}%`
        ),
        addField(
          'Dividend Distribution Cycle',
          financialInfo?.dividendDistribution,
          (v) => `${v}%`
        ),
        addField('Revenue (Last FY)', financialInfo?.revenueLastFy, (v) => `${v}%`),
        addField('Profit Sharing', financialInfo?.profitSharing, (v) => `${v}%`),
        addField(
          'Expected Capital Appreciation',
          financialInfo?.expectedCapitalAppreciation,
          (v) => `${v}%`
        ),
        addField('Project IRR', financialInfo?.projectedIrr, (v) => `${v}%`),
        addField(
          'Dividend Distribution cycle (on sale only)',
          financialInfo?.dividendDistributionCycle
        ),
        addField(
          'Latest Audited Financials DOCS*',
          financialInfo?.latestAuditedFinancials
        ),
        ...buildCustomFieldsData(financialCustomFields),
      ]?.filter(Boolean)
    : [
        addField('Current Valuation', financialInfo?.currentValuation, (v) =>
          formatCurrencyWithCrypto(v, usdtPrice, cryptoEnable)
        ),
        addField('Expected ROI', financialInfo?.expectedRoi, (v) => `${v}%`),
        addField(
          'Rental Yield per Annum',
          financialInfo?.rentalYield,
          (v) => `${v}%`
        ),
        addField(
          'Dividend Distribution Cycle',
          financialInfo?.dividendDistribution,
          (v) => `${v}`
        ),
        addField('Stamp Duty', financialInfo?.stampDuty, (v) =>
          formatCurrencyWithCrypto(v, usdtPrice, cryptoEnable)
        ),
        addField('Closing Expenses', financialInfo?.closingExpenses, (v) =>
          formatCurrencyWithCrypto(v, usdtPrice, cryptoEnable)
        ),
        addField('Registration Charges', financialInfo?.registrationCharges, (v) =>
          formatCurrencyWithCrypto(v, usdtPrice, cryptoEnable)
        ),
        addField('Brokerage Charges', financialInfo?.brokerageCharges, (v) =>
          formatCurrencyWithCrypto(v, usdtPrice, cryptoEnable)
        ),
        addField('Mutation Charges', financialInfo?.mutationCharges, (v) =>
          formatCurrencyWithCrypto(v, usdtPrice, cryptoEnable)
        ),
        ...buildCustomFieldsData(financialCustomFields),
      ]?.filter(Boolean);

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
        console.log('res?.data', res?.data);
        const {
          propertyDetails,
          financialInfo,
          tokenDetails,
          legalDocuments,
          investmentDetails,
          propertyData,
          equityDetails, // this will come in case of equity enable
          equityData, // this will come in case of equity enable
        } = res?.data;

        setPropertyDetails(equityEnable ? equityDetails : propertyDetails);
        setFinancialInfo(financialInfo);
        setTokenDetails(tokenDetails);
        setLegalDocuments(legalDocuments);
        setInvestmentDetails(investmentDetails);
        setTicker(
          equityEnable
            ? equityData?.ticker || tokenDetails?.ticker || 'N/A'
            : propertyData?.ticker || tokenDetails?.ticker || 'N/A'
        );
        setPropertyCustomFields(
          parseCustomFields(
            equityEnable
              ? equityDetails?.customFields
              : propertyDetails?.customFields
          )
        );
        setFinancialCustomFields(parseCustomFields(financialInfo?.customFields));
        setTokenCustomFields(parseCustomFields(tokenDetails?.customFields));
        setLegalCustomFields(parseCustomFields(legalDocuments?.customFields));
      } else {
        setPropertyDetails(null);
        setFinancialInfo(null);
        setTokenDetails(null);
        setLegalDocuments(null);
        setPropertyCustomFields(null);
        setFinancialCustomFields(null);
        setTokenCustomFields(null);
        setLegalCustomFields(null);
      }
    } catch (error: any) {
      console.error('Error fetching property details:', error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
    }
  }, [fetchPropertyDetails, id]);

  const toggleReadMore = () => {
    setIsReadMore(!isReadMore);
  };

  console.log('propertyDetails=========>', propertyDetails?.overview);

  // Get the correct overview text based on equityEnable
  const overviewText = equityEnable
    ? propertyDetails?.overview
    : propertyDetails?.propertyOverview;

  return (
    <div className="markets_detail">
      <CommonHeading
        heading={equityEnable ? 'Equity Details' : 'Properties Details'}
      />
      <div className="markets_detail_wrap">
        <div className="detail_inner">
          <div className="markets_detail_wrap_gallery">
            <Gallery Images={propertyDetails?.images} />
          </div>
          <div className="markets_detail_wrap_content">
            <Row>
              <Col lg={8} className="mb-5 mb-lg-0">
                <div className="detail_head">
                  <div className="detail_head_mainheading">
                    <h3>
                      {equityEnable
                        ? propertyDetails?.equityName
                        : propertyDetails?.propertyName}
                    </h3>
                  </div>
                  <p>
                    <span className="location_icon">
                      <LocationIcon />
                    </span>{' '}
                    {propertyDetails?.registeredAddress}
                  </p>
                </div>
                <div className="overview_content">
                  <h4> {equityEnable ? 'Equity Overview' : 'Property Overview'}</h4>
                  <p>
                    {overviewText
                      ? isReadMore
                        ? `${overviewText?.slice(0, MAX_LENGTH_READ_MORE_DESCRIPTION)}`
                        : overviewText
                      : ''}
                    {overviewText?.length > MAX_LENGTH_READ_MORE_DESCRIPTION && (
                      <span
                        style={{
                          color: '#007bff',
                          cursor: 'pointer',
                          marginLeft: '5px',
                        }}
                        onClick={toggleReadMore}
                      >
                        {isReadMore ? 'Read More' : 'Read Less'}
                      </span>
                    )}
                  </p>
                </div>
                <TabsComponent
                  activeTab={activeTab}
                  onSelect={(key) => setActiveTab(key ?? 'property')}
                  tabItems={tabItems}
                  className="marketsdetail_tabs"
                />

                <div className="tab_content property_content">
                  {activeTab === 'property' && (
                    <PropertyDetail items={propertyData} />
                  )}
                  {activeTab === 'info' && <PropertyDetail items={infoData} />}
                  {activeTab === 'document' && (
                    <DocumentDetail
                      documents={legalDocuments}
                      items={buildCustomUserData(legalCustomFields)}
                    />
                  )}
                </div>
              </Col>
              <Col lg={4}>
                {userCardData?.map((data, index) =>
                  equityEnable ? (
                    <UserCardEquity
                      key={index}
                      {...data}
                      tokenDetails={tokenDetails}
                      marketPlaceActiveTab={tokenDetails?.listingType}
                      tokenCustomFields={buildCustomUserData(tokenCustomFields)}
                      financialInfo={financialInfo}
                      propertyDetails={propertyDetails}
                      investmentDetails={investmentDetails}
                    />
                  ) : (
                    <UserCard
                      key={index}
                      {...data}
                      tokenDetails={tokenDetails}
                      marketPlaceActiveTab={tokenDetails?.listingType}
                      tokenCustomFields={buildCustomUserData(tokenCustomFields)}
                      financialInfo={financialInfo}
                      propertyDetails={propertyDetails}
                      investmentDetails={investmentDetails}
                      tickers={ticker}
                    />
                  )
                )}
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketsDetail;
