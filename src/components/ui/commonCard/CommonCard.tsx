import React, { ReactNode } from 'react';
import { LocationIcon } from '../../../assets/icons/SvgIcon';
import CommonButton from '../commonButton/CommonButton';
import Slider from 'react-slick';
import './CommonCard.scss';
import {
  formatAmount,
  formatCurrencyWithCrypto,
  truncateMiddle,
} from '../../../helpers/user/maskEmail';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useUsdtPrice } from '../../../hooks/useUsdtPrice';
import defaultImage from '../../../assets/images/property.jpeg';
import { IMAGE_BASE_URL } from '../../../utils/config';
import { PROPERTY_TYPE_ICONS } from '../../../constants/modules/onBoarding/marketPlaceConstants';
interface InvestmentCardProps {
  propertyName?: string;
  images?: string | string[];
  status?: string;
  registeredAddress?: string;
  currentValuation?: string;
  rentalYield?: string;
  grossYield?: string;
  endDate?: string;
  btnTitle?: string;
  to?: string;
  propertyType?: string;
  availableValue?: string;
  icon?: ReactNode;
  badges?: string[];
  propertyId?: string;
  primaryMarketPlaceActiveTab?: any;
  propertySize?: number;
  tokenPrice?: number;
  marketPlaceActiveTab?: string;
  investmentDetails: string | undefined | any;
  tokenDetails: string | undefined | any;
  isLocked?: boolean;
}

const CommonCard: React.FC<InvestmentCardProps> = ({
  propertyName,
  images,
  status,
  registeredAddress,
  currentValuation,
  rentalYield,
  grossYield,
  btnTitle,
  propertyType,
  propertyId,
  primaryMarketPlaceActiveTab,
  propertySize,
  tokenPrice,
  investmentDetails,
  isLocked,
}) => {
  let settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  };
  const navigate = useNavigate();
  const { cryptoEnable } = useSelector((state: RootState) => state.user.profile);
  const { usdtPrice } = useUsdtPrice();

  const getFullUrl = (path: string) => {
    if (!path) return defaultImage;
    if (path.startsWith('http')) return path;
    return IMAGE_BASE_URL + path;
  };

  const mediaList: string[] = Array.isArray(images)
    ? images?.map((img) => getFullUrl(String(img)))
    : images
      ? [getFullUrl(String(images))]
      : [defaultImage];

  let buttonTitle = '';
  let isDisabled = false;

  if (isLocked || status?.trim() === 'Closed') {
    buttonTitle = 'Property Closed';
    isDisabled = true;
  } else if (status?.trim() === 'Upcoming') {
    buttonTitle = 'Upcoming';
    isDisabled = true;
  } else {
    buttonTitle = btnTitle || 'Invest Now';
    isDisabled = false;
  }

  const renderMedia = (url: any, idx: number) => {
    const mediaUrl = typeof url === 'string' ? url : defaultImage;
    const isVideo =
      typeof mediaUrl === 'string' && mediaUrl.match(/\.(mp4|webm|ogg)$/i);

    return (
      <div key={idx} className="media-slide">
        {isVideo ? (
          <video autoPlay muted loop playsInline controls width="100%">
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={mediaUrl || defaultImage}
            alt={`property-${idx}`}
            style={{ width: '100%' }}
          />
        )}
      </div>
    );
  };
  const handleInvestClick = (
    propertyId: string,
    primaryMarketPlaceActiveTab: string
  ) => {
    navigate(`/user/markets/detail/${propertyId}`, {
      state: { primaryMarketPlaceActiveTab },
    });
  };

  return (
    <div className="common_card">
      <div className="common_card_img">
        <div className="common_card_img_list">
          {propertyType && PROPERTY_TYPE_ICONS[propertyType] && (
            <div className="common_card_img_list_chain">
              {React.createElement(PROPERTY_TYPE_ICONS[propertyType])}
              <span>{truncateMiddle(propertyType)}</span>
            </div>
          )}
          {primaryMarketPlaceActiveTab?.trim().toLowerCase() === 'fractional' &&
            investmentDetails?.totalToken &&
            investmentDetails?.tokenSold !== undefined && (
              <div className="common_card_img_list_avl">
                Available{' '}
                {formatAmount(
                  ((investmentDetails?.totalToken - investmentDetails?.tokenSold) /
                    investmentDetails?.totalToken) *
                    100
                )}
                %
              </div>
            )}{' '}
        </div>
        <div className="slider-container">
          <Slider {...settings}>
            {mediaList?.map((mediaUrl: any, idx: number) =>
              renderMedia(mediaUrl, idx)
            )}
          </Slider>
        </div>
      </div>
      <div className="common_card_content">
        <div className="common_card_content_status">
          <h5>{propertyName}</h5>
          <p>
            <span className="location_icon">
              <LocationIcon />
            </span>{' '}
            {registeredAddress}
          </p>
        </div>
        <ul className="common_card_content_list">
          <li>
            <span>Current Valuation</span>{' '}
            <strong>
              <strong>
                {formatCurrencyWithCrypto(currentValuation, usdtPrice, cryptoEnable)}
              </strong>
            </strong>
          </li>
          <li>
            <span>
              {primaryMarketPlaceActiveTab === 'FRACTIONAL'
                ? 'Token Price'
                : 'Property Size'}
            </span>{' '}
            <strong>
              {primaryMarketPlaceActiveTab === 'FRACTIONAL'
                ? formatCurrencyWithCrypto(tokenPrice, usdtPrice, cryptoEnable)
                : `${Number(propertySize) || 0} Sqft `}
              {'  '}
            </strong>
          </li>
          <li>
            <span>Gross Yield</span> <strong>{grossYield}%</strong>
          </li>
          <li>
            <span>Rental Yield P.A</span> <strong>{rentalYield}%</strong>
          </li>
        </ul>
        <div className="badges"></div>

        <CommonButton
          title={buttonTitle}
          className={isDisabled ? 'disabled' : ''}
          role="button"
          onClick={() => {
            if (propertyId && !isDisabled) {
              handleInvestClick(propertyId, primaryMarketPlaceActiveTab);
            } else {
              console.warn('propertyId is missing!');
            }
          }}
          fluid
        />
      </div>
    </div>
  );
};

export default CommonCard;
