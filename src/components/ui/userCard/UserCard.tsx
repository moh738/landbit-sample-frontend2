import React, { useEffect, useState } from 'react';
import { Col, ProgressBar, Row } from 'react-bootstrap';
import CommonButton from '../commonButton/CommonButton';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './UserCard.scss';
import {
  formatAmount,
  formatCurrencyWithCrypto,
  formatWithCommas,
} from '../../../helpers/user/maskEmail';
import store from '../../../redux/Store';
import { useSelector } from 'react-redux';
import { useUsdtPrice } from '../../../hooks/useUsdtPrice';
import { useUserSettings } from '../../../hooks/useUserSetting';
// import dayjs from 'dayjs';
// import customParseFormat from "dayjs/plugin/customParseFormat";

interface UserCardProps {
  blockchain: string;
  tokenSymbol: string;
  lockupPeriod: string;
  maxInvestment: string;
  listingType: any;
  totalSupply: string;
  buyBackPeriod: string;
  minInvestment: string;
  tokenDetails: string | undefined | any;
  marketPlaceActiveTab?: string;
  tokenCustomFields?: { label: string; value: string }[];
  propertyId?: string;
  financialInfo: string | undefined | any;
  plotArea?: string;
  propertyDetails: string | undefined | any;
  investmentDetails: string | undefined | any;
  tickers: string | undefined | any;
}

const UserCard: React.FC<UserCardProps> = ({
  tokenDetails,
  marketPlaceActiveTab,
  tokenCustomFields = [],
  financialInfo,
  propertyDetails,
  investmentDetails,
  tickers,
}) => {
  const navigate = useNavigate();

  const { id } = useParams();
  const location = useLocation();
  const isCreateOrderPage = location?.pathname?.includes('/create-order/');

  // dayjs.extend(customParseFormat);
  // const propertyStartDate = dayjs(propertyDetails?.startDate, "MM/DD/YYYY");
  // const currentDate = dayjs();
  // const isEligible = currentDate.isSame(propertyStartDate, "day") || currentDate.isAfter(propertyStartDate, "day");
  // console.log('isEligible========>', propertyDetails?.startDate);

  // dayjs.extend(customParseFormat);

  // const propertyStartDate = dayjs(propertyDetails?.startDate, 'DD MMM YYYY');
  // const currentDate = dayjs();

  // const isEligible =
  //   currentDate.isSame(propertyStartDate, 'day')
  // currentDate.isAfter(propertyStartDate, 'day');

  const validCustomFields = Array?.isArray(tokenCustomFields)
    ? tokenCustomFields.filter((f) => f?.label && f?.value)
    : [];
  const midPoint = Math.ceil(validCustomFields.length / 2);
  const leftCustomFields = validCustomFields.slice(0, midPoint);
  const rightCustomFields = validCustomFields.slice(midPoint);

  const equityEnable = store.getState().user.equityEnable;
  const { cryptoEnable } = useSelector((state: RootState) => state.user.profile);
  const { onBoardingStatus } = useSelector(
    (state: RootState) => state.onboarding
  );
  const { usdtPrice } = useUsdtPrice();
  const { fetchUserSettings } = useUserSettings();
  const [cryptoActiveSetting, setCryptoActiveSetting] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetchUserSettings();
        setCryptoActiveSetting(res?.data?.cryptoActive ?? null);
      } catch {
        setCryptoActiveSetting(null);
      }
    };
    loadSettings();
  }, [fetchUserSettings]);

  const isInvestDisabled =
    onBoardingStatus !== 'Verified' ||
    (cryptoEnable && cryptoActiveSetting !== '1');

  const tokenPrice = equityEnable 
    ? tokenDetails?.tokenPrice 
    : tokenDetails?.pricePerToken;

  return (
    <div className="usercard">
      <h4 className="usercard_price">
        <span>
          {marketPlaceActiveTab === 'Fractional Property'
            ? 'Token Price'
            : 'Property Price'}
        </span>{' '}
        {formatCurrencyWithCrypto(tokenPrice, usdtPrice, cryptoEnable) || '0'}
      </h4>
      {marketPlaceActiveTab === 'Fractional Property' && (
        <div className="usercard_progress">
          <ProgressBar
            now={
              (investmentDetails?.tokenSold / investmentDetails?.totalToken) * 100
            }
          />
          <div className="usercard_progress_value">
            <div className="usercard_progress_value_inner">
              <span>
                {formatAmount(
                  (investmentDetails?.tokenSold / investmentDetails?.totalToken) *
                    100
                )}
                {''}% Funded 
              </span>
              <span>
                 
                {formatCurrencyWithCrypto(
                  (investmentDetails?.totalToken - investmentDetails?.tokenSold) *
                    tokenPrice,
                  usdtPrice,
                  cryptoEnable
                )}{' '}
                Available
              </span>
            </div>
            <div className="usercard_progress_value_inner">
              <span> {formatAmount(investmentDetails?.investCount)} Investors</span>
              <span>
                {propertyDetails?.plotArea &&
                Number(propertyDetails.plotArea) > 0 ? (
                  <span>
                    {formatCurrencyWithCrypto(
                      Number(financialInfo?.currentValuation || 0) /
                        Number(propertyDetails.plotArea),
                      usdtPrice,
                      cryptoEnable
                    )}
                    /sqft
                  </span>
                ) : null}
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="usercard_tokenname">
        <p>
          Token Name <span>{tokenDetails?.tokenName}</span>
        </p>
      </div>

      <Row className="usercard_details">
        <Col xs={6} className="usercard_details_left">
          <p>
            Blockchain{' '}
            <span>{tokenDetails?.blockchain ? tokenDetails?.blockchain : '-'}</span>
          </p>
          <p>
            Token Symbol <span>{tickers}</span>
          </p>
          {Number(tokenDetails?.buyBackPeriod) > 0 && (
            <p>
              Lockup Period{'  '}{' '}
              <span>{`${tokenDetails.buyBackPeriod} Months`}</span>
            </p>
          )}
          {marketPlaceActiveTab === 'Full Ownership' && (
            <p>
              Fees{' '}
              <span>
                {financialInfo?.platformFee
                  ? `${financialInfo?.platformFee} %`
                  : '-'}
              </span>
            </p>
          )}
          {marketPlaceActiveTab === 'Fractional Property' && (
            <p>
              Min Investment{' '}
              <span>
                {tokenDetails?.minInvestment != null && tokenDetails?.minInvestment !== ''
                  ? `${formatWithCommas(tokenDetails.minInvestment)} LBITT`
                  : '-'}
              </span>
            </p>
          )}

          {leftCustomFields?.map((field, index) => (
            <p key={`custom-left-${index}`}>
              {field.label} <span>{field.value}</span>
            </p>
          ))}
        </Col>
        <Col xs={6} className="usercard_details_right">
          <p>
            Listing Type{' '}
            <span>
              {tokenDetails?.listingType ? tokenDetails?.listingType : '-'}
            </span>
          </p>
          <p>
            Total Token Supply{' '}
            <span>
              {equityEnable
                ? (tokenDetails?.totalSupply ?? tokenDetails?.tokenSupply) != null
                  ? formatWithCommas(tokenDetails?.totalSupply ?? tokenDetails?.tokenSupply)
                  : '-'
                : tokenDetails?.totalTokenSupply != null
                  ? formatWithCommas(tokenDetails?.totalTokenSupply)
                  : '-'}
            </span>
          </p>
          {Number(tokenDetails?.buyBackPeriod) > 0 && (
            <p>
              Buy Back Period <span>{`${tokenDetails?.buyBackPeriod} Months`}</span>
            </p>
          )}
          {marketPlaceActiveTab === 'Fractional Property' && (
            <p>
              Max Investment{' '}
              <span>
                {tokenDetails?.maxInvestment != null && tokenDetails?.maxInvestment !== ''
                  ? `${formatWithCommas(tokenDetails?.maxInvestment)} LBITT`
                  : '-'}
              </span>
            </p>
          )}

          {rightCustomFields.map((field, index) => (
            <p key={`custom-right-${index}`}>
              {field.label} <span>{field.value}</span>
            </p>
          ))}
        </Col>
      </Row>
      <div className="usercard_group">
        <Row>
          {!isCreateOrderPage && (
            <Col sm={12}>
              <CommonButton
                disabled={Boolean(isInvestDisabled)}
                title="Invest Now"
                fluid
                onClick={() => {
                  if (isInvestDisabled) return;
                  const propertyId = id || tokenDetails?.propertyId;
                  if (propertyId) {
                    navigate(`/user/markets/detail/create-order/${propertyId}`);
                  } else {
                    console.warn('Property ID not found');
                  }
                }}
              />
            </Col>
          )}
        </Row>
      </div>
    </div>
  );
};

export default UserCard;
