import CommonHeading from '../../../common/commonHeading/CommonHeading';
import friendscoin_img from '../../../../assets/images/friendscoin_img.png';
import './InviteFriends.scss';
import { Col, Row } from 'react-bootstrap';
import InviteForm from './InviteForm/InviteForm';
import {
  ExpiredIcon,
  FacebookIcon,
  ReferralIcon,
  ReturnIcon,
  TotalInvestmentsIcon,
  TwitterIcon,
  WhatsAppIcon,
} from '../../../../assets/icons/SvgIcon';
import StatsCard from '../dashboard/statsCard/StatsCard';
import TabsComponent from '../../../ui/tabsComponent/TabsComponent';
import CustomPagination from '../../../common/customPagination/CustomPagination';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReferralCommTable from './ReferralComissionTable';
import ReferralHistoryTable from './ReferralHistoryTable';
import { useReferralApis } from '../../../../hooks/referralHooks/useReferralApis';
import { useSelector, useDispatch } from 'react-redux';
import { LANDBIT_FRONTEND } from '../../../../utils/config';
import { setShouldRefreshReferrals } from '../../../../redux/Slices/wallet.slice';
import { formatReferralPoints } from '../../../../helpers/user/maskEmail';

const InviteFriends = () => {
  const dispatch = useDispatch();
  const referralCode = useSelector(
    (state: RootState) => state?.user?.profile?.referralKey
  );
  const shouldRefreshReferrals = useSelector(
    (state: RootState) => state?.wallet?.shouldRefreshReferrals
  );

  const initialFiltersRef = useRef<{
    search?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const {
    getTotalReferralDelivered,
    getReferralCommissionList,
    getReferralHistoryList,
    handleDownloadCSV,
  } = useReferralApis();

  const signupLink = `${LANDBIT_FRONTEND}sign-up?referralCode=${referralCode}`;

  const limit = 10;
  const [activeTab, setActiveTab] = useState('REFERRAL_COMMISSION');
  const [inputFilters, setInputFilters] = useState(initialFiltersRef.current);
  const [filters, setFilters] = useState(initialFiltersRef.current);
  const [page, setPage] = useState(1);
  const [referralData, setReferralData] = useState<{
    referralBalance: string;
    referralBalanceExpired: string;
    referralBalanceUsed: string;
  }>({
    referralBalance: '',
    referralBalanceExpired: '',
    referralBalanceUsed: '',
  });
  const [referralsCount, setReferralsCount] = useState(0);
  const [referralList, setReferralList] = useState<any[]>([]);
  const [referralHistoryList, setReferralHistoryList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [totalCount, setTotalCount] = useState(0);

  const handleFilterChange = (newFilters: {
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    setSearchQuery(newFilters?.search?.trim() || '');
    setInputFilters(newFilters);
    setPage(1);
  };

  useEffect(() => {
    if (inputFilters === filters) return;
    const id = setTimeout(() => {
      setFilters((prev) => (prev === inputFilters ? prev : inputFilters));
    }, 700);

    return () => clearTimeout(id);
  }, [inputFilters, filters]);

  const handlePageChange = (selected: { selected: number }) => {
    const newPage = selected?.selected + 1;
    setPage(newPage);
  };

  const handleExportCSVClick = async () => {
    const commissionP =
      activeTab === 'REFERRAL_COMMISSION'
        ? getReferralCommissionList(page, limit, filters, true)
        : Promise.resolve(null);
    const historyP =
      activeTab === 'REFERRAL_HISTORY'
        ? getReferralHistoryList(page, limit, filters, true)
        : Promise.resolve(null);
    const [commission, history] = await Promise.all([commissionP, historyP]);
    if (commission) {
      handleDownloadCSV('commission', commission);
    }
    if (history) {
      handleDownloadCSV('history', history);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const referralDataResponse = await getTotalReferralDelivered();

        const referralListResponse =
          activeTab === 'REFERRAL_COMMISSION'
            ? getReferralCommissionList(page, limit, filters, false)
            : Promise.resolve(null);
        const referralHistoryResponse =
          activeTab === 'REFERRAL_HISTORY'
            ? getReferralHistoryList(page, limit, filters, false)
            : Promise.resolve(null);

        const [referralData, referralListData, referralHistoryData] =
          await Promise.all([
            referralDataResponse,
            referralListResponse,
            referralHistoryResponse,
          ]);
        if (cancelled) return;

        setReferralData(referralData ?? {});
        if (referralListData) {
          setReferralList(referralListData ?? []);
          setReferralsCount(referralListData.total ?? 0);
          setTotalCount(referralListData.total ?? 0);
        } else {
          setReferralList([]);
          setTotalCount(0);
        }
        if (referralHistoryData) {
          setReferralHistoryList(referralHistoryData ?? []);
          setTotalCount(referralHistoryData.total ?? 0);
        } else {
          setReferralHistoryList([]);
          setTotalCount(0);
        }
      } catch (err) {
        // console.log(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    page,
    limit,
    filters,
    getTotalReferralDelivered,
    getReferralCommissionList,
    getReferralHistoryList,
  ]);

  useEffect(() => {
    if (shouldRefreshReferrals) {
      let cancelled = false;

      (async () => {
        try {
          const referralDataResponse = await getTotalReferralDelivered();

          const referralListResponse =
            activeTab === 'REFERRAL_COMMISSION'
              ? getReferralCommissionList(page, limit, filters, false)
              : Promise.resolve(null);
          const referralHistoryResponse =
            activeTab === 'REFERRAL_HISTORY'
              ? getReferralHistoryList(page, limit, filters, false)
              : Promise.resolve(null);

          const [referralData, referralListData, referralHistoryData] =
            await Promise.all([
              referralDataResponse,
              referralListResponse,
              referralHistoryResponse,
            ]);
          if (cancelled) return;
          setReferralData(referralData ?? {});
          if (referralListData) {
            setReferralList(referralListData ?? []);
            setReferralsCount(referralListData.total ?? 0);
            setTotalCount(referralListData.total ?? 0);
          } else {
            setReferralList([]);
            setTotalCount(0);
          }
          if (referralHistoryData) {
            setReferralHistoryList(referralHistoryData ?? []);
            setTotalCount(referralHistoryData.total ?? 0);
          } else {
            setReferralHistoryList([]);
            setTotalCount(0);
          }
          dispatch(setShouldRefreshReferrals(false));
        } catch (err) {
          dispatch(setShouldRefreshReferrals(false));
        }
      })();

      return () => {
        cancelled = true;
      };
    }
  }, [
    shouldRefreshReferrals,
    activeTab,
    page,
    limit,
    filters,
    getTotalReferralDelivered,
    getReferralCommissionList,
    getReferralHistoryList,
    dispatch,
  ]);

  const referralCard = useMemo(
    () => [
      {
        icon: <ReturnIcon />,
        value: `${formatReferralPoints(
          Number(referralData?.referralBalance || 0) +
            Number(referralData?.referralBalanceExpired || 0) +
            Number(referralData?.referralBalanceUsed || 0)
        )} Points`,
        subtitle: 'Total Referral Earned',
        className: 'lightpurpleclr',
      },
      {
        icon: <ReferralIcon />,
        value: `${formatReferralPoints(referralData?.referralBalance)} Points`,
        subtitle: 'Referral Available',
        className: 'greenclr',
      },
      {
        icon: <TotalInvestmentsIcon />,
        value: `${formatReferralPoints(referralData?.referralBalanceUsed)} Points`,
        subtitle: 'Total Used',
        className: 'lightblueclr',
      },
      {
        icon: <ExpiredIcon />,
        value: `${formatReferralPoints(referralData?.referralBalanceExpired)} Points`,
        subtitle: 'Total Expired',
        className: 'lightorangeclr',
      },
    ],
    [referralData]
  );

  const shareText = `I've started my investment journey with LandBitt, and you can too!

It's transparent, secure, and easy to get started.

Sign up using my referral link:

👉 ${signupLink}

You'll get access to premium land listings, fractional ownership options, and a simple dashboard to track your growth.

Invest smart. Invest small. Grow big`;

  // Twitter-optimized share text (plain text only, no emoji, no extra formatting, shortened to avoid highlighting and fit character limit)
  const twitterShareText = `I've started my investment journey with LandBitt, and you can too!

It's transparent, secure, and easy to get started.

Sign up using my referral link:

👉 ${signupLink}

You'll get access to premium land listings, fractional ownership options, and a simple dashboard to track your growth.

Invest smart. Invest small. Grow big`;

  const handleFacebookShare = () => {
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(signupLink)}&quote=${encodeURIComponent(shareText)}`;
    // Open in popup window
    const width = 626;
    const height = 436;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open(
      facebookShareUrl,
      'facebook-share-dialog',
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1`
    );
  };

  const handleTwitterShare = () => {
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterShareText)}`;

    const width = 550;
    const height = 420;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      twitterShareUrl,
      'twitter-share-dialog',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleWhatsAppShare = () => {
    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappShareUrl, '_blank');
  };

  const tabItems = [
    {
      key: 'REFERRAL_COMMISSION',
      label: `Referrals (${referralsCount})`,
    },
    { key: 'REFERRAL_HISTORY', label: 'Referral History' },
  ];

  return (
    <>
      <section className="invitefriends">
        <CommonHeading heading="Invite Friends" />
        <div className="friends_data">
          <div className="content">
            <h5>Share with</h5>
            <h2>Friends and Family</h2>
            <p>
              Start earning. Share you referral codes with your social network or
              embed them in your website promotions. Watch your earnings grow as your
              referrals become affiliates, and your network flourishes.
            </p>
          </div>
          <div className="friend_rightImg">
            <img src={friendscoin_img} alt="friendscoin_img" />
          </div>
        </div>
        <Row>
          <Col md={7} className="mb-4 mb-md-0">
            <InviteForm />
          </Col>
          <Col md={5} className="">
            <div className="share_data">
              <h5>Share this on</h5>
              <div className="btn_icon">
                <button
                  onClick={handleFacebookShare}
                  className="fb_btn"
                  type="button"
                >
                  <span>
                    <FacebookIcon />
                  </span>
                  Facebook
                </button>
                <button
                  onClick={handleTwitterShare}
                  className="twitter_btn"
                  type="button"
                >
                  <span>
                    <TwitterIcon />
                  </span>
                  Twitter
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="whatsapp_btn"
                  type="button"
                >
                  <span>
                    <WhatsAppIcon />
                  </span>
                  WhatsApp
                </button>
              </div>
            </div>
          </Col>
        </Row>
        <div className="referral_cards">
          <Row>
            {referralCard?.map((item, index) => (
              <Col key={index} xl={3} lg={4} sm={6}>
                <StatsCard
                  icon={item.icon}
                  value={item.value}
                  subtitle={item.subtitle}
                  className={item.className}
                />
              </Col>
            ))}
          </Row>
        </div>
        <CommonHeading heading="Referral History" />
        <TabsComponent
          activeTab={activeTab}
          onSelect={(key) => setActiveTab(key ?? 'REFERRAL_COMMISSION')}
          tabItems={tabItems}
          className="referral_tabs"
        />
        <div className="tab_content">
          {activeTab === 'REFERRAL_COMMISSION' && (
            <ReferralCommTable
              referralCommissionList={referralList}
              onFilterChange={handleFilterChange}
              searchQuery={searchQuery}
              startDate={inputFilters?.startDate}
              endDate={inputFilters?.endDate}
              onExportCSVClick={handleExportCSVClick}
            />
          )}
          {activeTab === 'REFERRAL_HISTORY' && (
            <ReferralHistoryTable
              referralHistoryList={referralHistoryList}
              onExportCSVClick={handleExportCSVClick}
              searchQuery={searchQuery}
              startDate={inputFilters?.startDate}
              endDate={inputFilters?.endDate}
            />
          )}
        </div>
        {activeTab === 'REFERRAL_COMMISSION' && totalCount > limit && (
          <CustomPagination
            handlePageChange={handlePageChange}
            pageCount={Math.ceil(totalCount / limit)}
            forcePage={page - 1}
          />
        )}
      </section>
    </>
  );
};

export default InviteFriends;
