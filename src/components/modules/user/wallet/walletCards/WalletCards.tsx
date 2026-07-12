import {
  // InrIcon,
  // UsdcDepositIcon,
  // UsdtDepositIcon,
  WalletGreenIcon,
  WalletPendingIcon,
  WalletWithdrawIcon,
} from '../../../../../assets/icons/SvgIcon';
// import { Dropdown } from 'react-bootstrap';
import CommonButton from '../../../../ui/commonButton/CommonButton';
import { useNavigate } from 'react-router-dom';
import { useModal } from '@ebay/nice-modal-react';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
// import FormControl from '../../../../formik/FormControl';
import { useGetAmount } from '../../../../../hooks/userGetAmount';
import { Col, Row } from 'react-bootstrap';
import { useGetAdminWallet } from '../../../../../hooks/useGetAdminWallet';
import Toast from '../../../../common/Toast';
import {
  formatAmount,
  formatCompactNumber,
  safeNumber,
  formatUSDTCompact,
  formatUSDTWithCommas,
} from '../../../../../helpers/user/maskEmail';
import { useUserSettings } from '../../../../../hooks/useUserSetting';
import CustomTooltip from '../../../../ui/customTooltip/CustomTooltip';
import { useDispatch } from 'react-redux';
import { setShouldRefreshWalletBalance } from '../../../../../redux/Slices/wallet.slice';
import { useBankDetails } from '../../../../../hooks/useBankDetail';
import { useUsdtPrice } from '../../../../../hooks/useUsdtPrice';
interface WalletCardsProps {
  onTransactionSuccess?: () => void;
}
const WalletCards = ({ onTransactionSuccess }: WalletCardsProps) => {
  const navigate = useNavigate();
  const { fetchAdminWallet } = useGetAdminWallet();
  const WalletDepositModal = useModal('WalletDepositModal');
  const { cryptoEnable } = useSelector((state: RootState) => state.user.profile);
  const { usdtPrice } = useUsdtPrice();

  const { fetchUserSettings } = useUserSettings();
  const { fetchBankingDetails } = useBankDetails();

  const WalletWithdrawModal = useModal('WalletWithdrawModal');
  const [userWalletBalance, setUserWalletBalance] = useState<any>({});
  const [userpendingDeposit, setUserPendingDeposit] = useState<any>({});
  const [userpendingWithDrawal, setUserPendingWithdrawal] = useState<any>({});
  const [adminWallet, setAdminWallet] = useState<any>(null);
  const [feesPerecntage, setfeesPerecntage] = useState<number>();
  const [withdrawalFeeUsdtPercent, setWithdrawalFeeUsdtPercent] = useState<number>(0);
  const [cryptoActiveSetting, setCryptoActiveSetting] = useState<string | null>(null);

  const dispatch = useDispatch();
  // Get payment status and refresh flag from Redux to update wallet cards
  const { paymentStatus, shouldRefreshWalletBalance } = useSelector(
    (state: RootState) => state?.wallet
  );
  // const networktype = [
  //   { label: 'INR', value: 'inr' },
  //   // { label: 'USDC', value: 'usdc' },
  //   // { label: 'USDT', value: 'usdt' },
  // ];

  const { fetchAmount } = useGetAmount();

  const loadBankAmount = useCallback(async () => {
    try {
      const res = await fetchAmount();

      if (res?.success && res?.data) {
        setUserWalletBalance({ ...res?.data?.portfolio });
        const pendingDeposit = res?.data?.ledger?.pendingDeposit;
        if (pendingDeposit && typeof pendingDeposit === 'object') {
          setUserPendingDeposit({ ...pendingDeposit });
        } else if (pendingDeposit !== undefined && pendingDeposit !== null) {
          setUserPendingDeposit({ inr: Number(pendingDeposit) });
        } else {
          setUserPendingDeposit({});
        }
        const pendingWithdrawal = res?.data?.ledger?.pendingWithdrawal;
        if (pendingWithdrawal && typeof pendingWithdrawal === 'object') {
          setUserPendingWithdrawal({ ...pendingWithdrawal });
        } else if (pendingWithdrawal !== undefined && pendingWithdrawal !== null) {
          setUserPendingWithdrawal({ inr: Number(pendingWithdrawal) });
        } else {
          setUserPendingWithdrawal({});
        }
      }
    } catch (error) {
      console.error('Error preloading bank details:', error);
    }
  }, [fetchAmount]);

  useEffect(() => {
    loadBankAmount();
  }, [loadBankAmount]);

  useEffect(() => {
    if (shouldRefreshWalletBalance && paymentStatus) {
      loadBankAmount();
      dispatch(setShouldRefreshWalletBalance(false));
    }
  }, [shouldRefreshWalletBalance, paymentStatus, loadBankAmount, dispatch]);

  const handleDepositClick = () => {
    if (!cryptoEnable) {
      if (!adminWallet) {
        Toast.error('Admin payment methods are not configured yet.');
        return;
      }
      const hasBank = Boolean(adminWallet?.accountNumber);
      const hasUpi = Boolean(adminWallet?.upiId);
      if (!hasBank && !hasUpi) {
        Toast.error('Admin payment methods are not configured yet.');
        return;
      }
    }

    if (cryptoEnable) {
      if (cryptoActiveSetting !== '1') {
        Toast.error('Admin payment methods are not configured yet.');
        return;
      }
      WalletDepositModal.show({
        closeWalletDepostModal: () => WalletDepositModal.remove(),
        activeMethod: 'both',
        onTransactionSuccess: async () => {
          await loadBankAmount();
          onTransactionSuccess?.();
        },
        navigate,
      });
      return;
    }

    const hasBank = Boolean(adminWallet?.accountNumber);
    const hasUpi = Boolean(adminWallet?.upiId);

    if (!hasBank && hasUpi) {
      // Toast.info('Bank payment is currently unavailable. Please proceed with UPI.');
      WalletDepositModal.show({
        closeWalletDepostModal: () => WalletDepositModal.remove(),
        activeMethod: 'upi',
        onTransactionSuccess: async () => {
          await loadBankAmount();
          onTransactionSuccess?.();
        },
        navigate,
      });
      return;
    }

    if (hasBank && !hasUpi) {
      // Toast.info('UPI payment is currently unavailable. Please proceed with Bank.');
      WalletDepositModal.show({
        closeWalletDepostModal: () => WalletDepositModal.remove(),
        activeMethod: 'bank',
        onTransactionSuccess: async () => {
          await loadBankAmount();
          onTransactionSuccess?.();
        },
        navigate,
      });
      return;
    }

    WalletDepositModal.show({
      closeWalletDepostModal: () => WalletDepositModal.remove(),
      activeMethod: 'both',
      onTransactionSuccess: async () => {
        await loadBankAmount();
        onTransactionSuccess?.();
      },
      navigate,
    });
  };

  const handleWithdrawClick = async () => {
    if (cryptoEnable) {
      if (cryptoActiveSetting !== '1') {
        Toast.error('Withdraw unavailable');
        return;
      }
      WalletWithdrawModal.show({
        closeWalletWithdrawModal: () => WalletWithdrawModal.remove(),
        navigate,
        onTransactionSuccess: async () => {
          await loadBankAmount();
          onTransactionSuccess?.();
        },
      });
      return;
    }

    const res = await fetchBankingDetails(true);

    if (!res?.success || !res?.data) {
      Toast.info('Unable to fetch bank/UPI details currently.');
      return;
    }

    const { approvedWallet, pendingRequests = [], hasPendingRequest } = res?.data;
    const { panNo, accountNumber, ifscCode, upiId } = approvedWallet || {};

    const isUpiAccount = accountNumber?.includes('@');
    const hasApprovedBank = accountNumber && ifscCode && !isUpiAccount;
    const hasApprovedUpi = isUpiAccount || upiId;

    const pendingRequestsArray = Array.isArray(pendingRequests) ? pendingRequests : [];

    const hasPendingBank = pendingRequestsArray.some(
      (req: any) =>
        req?.bankName &&
        req?.ifscCode &&
        (req?.status === 'Pending' || req?.status === 'pending')
    );
    const hasPendingUpi = pendingRequestsArray.some(
      (req: any) =>
        !req?.bankName &&
        !req?.ifscCode &&
        req?.accountNumber?.includes('@') &&
        (req?.status === 'Pending' || req?.status === 'pending')
    );

    // If there is no approved Bank or UPI yet, but there is a pending request,
    // block withdrawals completely until admin approves one of them.
    if (!hasApprovedBank && !hasApprovedUpi && (hasPendingRequest || hasPendingBank || hasPendingUpi)) {
      Toast.info(
        'Your bank/UPI details are pending approval. Withdrawals will be enabled once your request is approved.'
      );
      return;
    }

    // If PAN is missing, user must complete KYC before any withdrawal.
    if (!panNo) {
      Toast.info('Please add your PAN card to proceed.');
      // Use requestAnimationFrame to ensure toast renders, then delay navigation for smooth transition
      requestAnimationFrame(() => {
        setTimeout(() => {
          navigate('/user/settings?tab=general');
        }, 200);
      });
      return;
    }

    // At least one method (Bank or UPI) is approved and PAN is present:
    // allow user to open the Withdraw modal. Inside the modal, individual
    // methods (Bank / UPI) are enabled/disabled based on their own pending state.
    WalletWithdrawModal.show({
      closeWalletWithdrawModal: () => WalletWithdrawModal.remove(),
      navigate,
      onTransactionSuccess: async () => {
        await loadBankAmount();
        onTransactionSuccess?.();
      },
    });
  };

  useEffect(() => {
    const getWalletData = async () => {
      try {
        const res = await fetchAdminWallet();
        if (res?.success && res?.data?.approvedWallet) {
          setAdminWallet(res?.data?.approvedWallet);
        } else {
          setAdminWallet(null);
        }
      } catch (err) {
        console.error('Failed to fetch admin wallet:', err);
        setAdminWallet(null);
      }
    };
    getWalletData();
  }, [fetchAdminWallet]);

  useEffect(() => {
    const getUserWalletSettings = async () => {
      try {
        const res = await fetchUserSettings();
        setfeesPerecntage(res?.data?.withdrawalFee);
        const feeUsdtPercent =
          Number(res?.data?.withdrawalFeeUsdtPercent) ||
          Number(res?.data?.withdrawalFeeUsdt) ||
          0;
        setWithdrawalFeeUsdtPercent(feeUsdtPercent);
        setCryptoActiveSetting(res?.data?.cryptoActive ?? null);
      } catch (err) {
        console.error('Failed to fetch admin wallet:', err);
      }
    };
    getUserWalletSettings();
  }, [fetchUserSettings]);

  // const totalBalance = cryptoEnable 
  //   ? Number(userWalletBalance?.usdtBalance || 0)
  //   : Number(userWalletBalance?.inrBalance || 0);
  // const lockedFunds = cryptoEnable
  //   ? Number(userWalletBalance?.usdtDepositInLastXDays || 0)
  //   : Number(userWalletBalance?.inrDepositInLastXDays || 0);
  // const feePercent = Number(feesPerecntage || 0);
  // const displayLockedFunds = lockedFunds > 0 ? totalBalance : lockedFunds;
  // const effectiveLockedForCalculation = lockedFunds > totalBalance ? totalBalance : lockedFunds;
  // let freeBalance = totalBalance - effectiveLockedForCalculation;
  // if (freeBalance < 0) freeBalance = 0;
   const totalBalance = cryptoEnable
     ? safeNumber(userWalletBalance?.usdtBalance)
     : safeNumber(userWalletBalance?.inrBalance);
   const lockedFundsRaw = cryptoEnable
     ? safeNumber(userWalletBalance?.usdtDepositInLastXDays)
     : safeNumber(userWalletBalance?.inrDepositInLastXDays);
   const feePercent = cryptoEnable
     ? (withdrawalFeeUsdtPercent > 0 ? withdrawalFeeUsdtPercent : safeNumber(feesPerecntage))
     : safeNumber(feesPerecntage);
   // Locked funds must never exceed available wallet balance (cap for calculation and display)
   const effectiveLockedForCalculation =
     lockedFundsRaw <= 0 ? 0 : Math.min(lockedFundsRaw, totalBalance);
   const freeBalance = Math.max(0, totalBalance - effectiveLockedForCalculation);
   const displayLockedFunds = effectiveLockedForCalculation;


  const formatFullNumber = (num: any) => {
    if (num === null || num === undefined) return '0.00';
    const numValue = Number(num);
    if (isNaN(numValue)) return '0.00';

    const str = numValue.toString();
    const [integerPartRaw, decimalPartRaw = ''] = str.split('.');

    const formattedInteger = Number(integerPartRaw || '0').toLocaleString('en-IN');
    const paddedDecimals = (decimalPartRaw + '00').slice(0, 2); // truncate, no round

    return `${formattedInteger}.${paddedDecimals}`;
  };

  const formatFullUSDT = (num: any) => {
    if (num === null || num === undefined) return '0.0';
    return formatUSDTWithCommas(num);
  };

  const locklist: {
    title: string;
    value: any;
    subTitle: string;
    valueclr?: string;
    subTitleclr?: string;
  }[] = [];

  locklist.push({
    title: 'Available for Withdrawal',
    value: (
      <>
        {cryptoEnable ? (
          <>
            {formatUSDTCompact(freeBalance)} USDT
            {CustomTooltip(`${formatFullUSDT(safeNumber(freeBalance))} USDT`)}
          </>
        ) : (
          <>
            ₹{formatCompactNumber(freeBalance)}
            {CustomTooltip(`₹${formatFullNumber(safeNumber(freeBalance))}`)}
          </>
        )}
      </>
    ),
    subTitle: 'No Fees',
  });

  locklist.push({
    title: 'Locked Funds',
    value: (
      <>
        {cryptoEnable ? (
          <>
            {formatUSDTCompact(displayLockedFunds)} USDT
            {CustomTooltip(`${formatFullUSDT(safeNumber(displayLockedFunds))} USDT`)}
          </>
        ) : (
          <>
            ₹{formatCompactNumber(displayLockedFunds)}
            {CustomTooltip(`₹${formatFullNumber(safeNumber(displayLockedFunds))}`)}
          </>
        )}
      </>
    ),
    subTitle: feePercent ? `Fee: ${formatAmount(feePercent)}% will apply on withdraw` : 'No Fees',
  });

  return (
    <>
      <div className="wallet_cards">
        <Row className="mb-4 mb-lg-5">
          <Col xxl={4} md={5} className="mb-3 mb-md-0">
            <div className="wallet_box left">
              <div className="balance_select">
                <div className="box_wrap">
                  <div className="icon_wrap">
                    <WalletGreenIcon />
                  </div>
                  <div className="info_wrap">
                    <h6 className="title">Total Available Balance</h6>
                    <h2 className="desc">
                      {cryptoEnable ? (
                        <>
                          {formatUSDTCompact(userWalletBalance?.usdtBalance || 0)}{' '}
                          USDT
                          {CustomTooltip(
                            `${formatFullUSDT(safeNumber(userWalletBalance?.usdtBalance || 0))} USDT`
                          )}
                        </>
                      ) : (
                        <>
                          ₹
                          {formatCompactNumber(userWalletBalance?.inrBalance || 0.0)}
                          {CustomTooltip(
                            `₹${formatFullNumber(safeNumber(userWalletBalance?.inrBalance || 0))}`
                          )}
                        </>
                      )}
                    </h2>
                  </div>
                </div>
              </div>
              <div className="wallet_btns">
                <CommonButton
                  className="walletdeposit_btn"
                  title="Deposit Funds"
                  disabled={cryptoEnable ? cryptoActiveSetting !== '1' : false}
                  onClick={handleDepositClick}
                />
                <CommonButton
                  className="walletdeposit_btn"
                  title="Withdraw Funds"
                  disabled={
                    cryptoEnable
                      ? !(
                          cryptoActiveSetting === '1' &&
                          Number(userWalletBalance?.usdtBalance || 0) > 0
                        )
                      : Number(userWalletBalance?.inrBalance || 0) <= 0
                  }
                  onClick={handleWithdrawClick}
                />
              </div>
            </div>
          </Col>
          <Col xxl={8} md={7}>
            <div className="wallet_box right">
              <h5>Deposit Lock Period Active</h5>
              <div className="lockcard">
                {/* <p>
                  {cryptoEnable ? (
                    <>
                      {formatUSDTCompact(displayLockedFunds)} USDT locked
                      {CustomTooltip(
                        `${formatFullUSDT(safeNumber(displayLockedFunds))} USDT`
                      )}
                    </>
                  ) : (
                    <>
                      ₹{formatCompactNumber(displayLockedFunds)} locked
                      {CustomTooltip(
                        `₹${formatFullNumber(safeNumber(displayLockedFunds))}`
                      )}
                    </>
                  )}
                </p> */}
                <ul>
                  <li>
                    <span>0-60 days:</span> Withdrawal allowed but withdrawal charges
                    apply
                  </li>
                  <li>
                    <span>After 60 days:</span> Free withdrawal with no charges
                  </li>
                  <li>You can use these funds to buy property anytime</li>
                </ul>
              </div>
              <div className="period_funds">
                <Row>
                  {locklist.map((item: any, index: any) => (
                    <Col xs={6} key={index}>
                      <div className="avlwithdraw">
                        <p>{item.title}</p>
                        <h4 className={`${item.valueclr}`}>{item.value}</h4>
                        <span className={`${item.subTitleclr}`}>
                          {item.subTitle}
                        </span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </div>
          </Col>
        </Row>
        <div className="wallet_wrap">
          <Row>
            {!cryptoEnable && (
              <Col lg={4} sm={6}>
                <div className="wallet_box drop_pending">
                  <div className="box_wrap">
                    <div className="icon_wrap">
                      <WalletPendingIcon />
                    </div>
                    <div className="info_wrap">
                      <h6 className="title">
                        Pending Deposits
                        {CustomTooltip(
                          `Fee is not included in this pending amount.\nRefer to your txn history for details.`
                        )}
                      </h6>

                      {/* </Dropdown.Toggle> */}
                      {/* <Dropdown.Menu align={'end'}> */}
                      {/* <div className="drop_head"> */}
                      {/* <Link to="/">
                          <div className="deposit_wrap">
                            <div className="inr_img">
                              <InrIcon />
                              <p>INR</p>
                            </div>
                           
                          </div>
                        </Link> */}
                      {/* <Link to="/" className="disabled">
                          <div className="deposit_wrap">
                            <div className="inr_img">
                              <UsdtDepositIcon />
                              <p>USDT</p>
                            </div>
                            <p>{'0.00'}</p>
                          </div>
                        </Link> */}
                      {/* <Link to="/" className="disabled">
                          <div className="deposit_wrap">
                            <div className="inr_img">
                              <UsdcDepositIcon />
                              <p>USDC</p>
                            </div>
                            <p>{'0.00'}</p>
                          </div>
                        </Link>
                      </div>
                    </Dropdown.Menu>
                  </Dropdown> */}
                      {/* <p> {formatAmount(userpendingDeposit?.inr)}</p> */}
                      <h2 className="desc">
                        {cryptoEnable ? (
                          <>
                            {(() => {
                              // If API provides USDT value, use it; otherwise convert from INR
                              const inrValue =
                                userpendingDeposit?.inr !== undefined &&
                                userpendingDeposit?.inr !== null
                                  ? Number(userpendingDeposit.inr)
                                  : typeof userpendingDeposit === 'number'
                                    ? userpendingDeposit
                                    : 0;

                              const pendingDepositUsdt =
                                userpendingDeposit?.usdt !== undefined &&
                                userpendingDeposit?.usdt !== null
                                  ? Number(userpendingDeposit.usdt)
                                  : usdtPrice &&
                                      usdtPrice > 0 &&
                                      inrValue !== undefined &&
                                      inrValue !== null &&
                                      !isNaN(inrValue)
                                    ? inrValue / usdtPrice
                                    : 0;

                              return (
                                <>
                                  {formatUSDTCompact(pendingDepositUsdt)} USDT
                                  {CustomTooltip(
                                    `${formatFullUSDT(safeNumber(pendingDepositUsdt))} USDT`
                                  )}
                                </>
                              );
                            })()}
                          </>
                        ) : (
                          <>
                            ₹
                            {formatCompactNumber(
                              userpendingDeposit?.inr
                                ? Number(userpendingDeposit.inr)
                                : typeof userpendingDeposit === 'number'
                                  ? userpendingDeposit
                                  : 0
                            )}
                            {CustomTooltip(
                              `₹${formatFullNumber(
                                safeNumber(
                                  userpendingDeposit?.inr
                                    ? Number(userpendingDeposit.inr)
                                    : typeof userpendingDeposit === 'number'
                                      ? userpendingDeposit
                                      : 0
                                )
                              )}`
                            )}
                          </>
                        )}
                      </h2>
                    </div>
                  </div>
                </div>
              </Col>
            )}
            <Col lg={4} sm={6}>
              <div className="wallet_box">
                <div className="box_wrap">
                  <div className="icon_wrap">
                    <WalletWithdrawIcon />
                  </div>
                  <div className="info_wrap">
                    <h6 className="title">
                      Pending Userlock Amount
                      {CustomTooltip(
                        `This amount is locked until the admin reviews your investment request.`
                      )}
                    </h6>

                    <h2 className="desc">
                      {cryptoEnable ? (
                        <>
                          {formatUSDTCompact(userWalletBalance?.usdtLocked || '0')}{' '}
                          USDT
                          {CustomTooltip(
                            `${formatFullUSDT(safeNumber(userWalletBalance?.usdtLocked || 0))} USDT`
                          )}
                        </>
                      ) : (
                        <>
                          ₹{formatCompactNumber(userWalletBalance?.inrLocked || '0')}
                          {CustomTooltip(
                            `₹${formatFullNumber(safeNumber(userWalletBalance?.inrLocked || 0))}`
                          )}
                        </>
                      )}
                    </h2>
                  </div>
                </div>
              </div>
            </Col>
            {!cryptoEnable && (
              <Col lg={4} sm={6}>
                <div className="wallet_box">
                  <div className="box_wrap">
                    <div className="icon_wrap">
                      <WalletWithdrawIcon />
                    </div>
                    <div className="info_wrap">
                      <h6 className="title">
                        Pending Withdrawals
                        {CustomTooltip(
                          `Fee is included in this pending amount.\nRefer to your txn history for details.`
                        )}
                      </h6>

                      <h2 className="desc">
                        {cryptoEnable ? (
                          <>
                            {(() => {
                              // If API provides USDT value, use it; otherwise convert from INR
                              const inrValue =
                                userpendingWithDrawal?.inr !== undefined &&
                                userpendingWithDrawal?.inr !== null
                                  ? Number(userpendingWithDrawal.inr)
                                  : typeof userpendingWithDrawal === 'number'
                                    ? userpendingWithDrawal
                                    : 0;

                              const pendingWithdrawalUsdt =
                                userpendingWithDrawal?.usdt !== undefined &&
                                userpendingWithDrawal?.usdt !== null
                                  ? Number(userpendingWithDrawal.usdt)
                                  : usdtPrice &&
                                      usdtPrice > 0 &&
                                      inrValue !== undefined &&
                                      inrValue !== null &&
                                      !isNaN(inrValue)
                                    ? inrValue / usdtPrice
                                    : 0;

                              return (
                                <>
                                  {formatUSDTCompact(pendingWithdrawalUsdt)} USDT
                                  {CustomTooltip(
                                    `${formatFullUSDT(safeNumber(pendingWithdrawalUsdt))} USDT`
                                  )}
                                </>
                              );
                            })()}
                          </>
                        ) : (
                          <>
                            ₹
                            {formatCompactNumber(
                              userpendingWithDrawal?.inr
                                ? Number(userpendingWithDrawal.inr)
                                : typeof userpendingWithDrawal === 'number'
                                  ? userpendingWithDrawal
                                  : 0
                            )}
                            {CustomTooltip(
                              `₹${formatFullNumber(
                                safeNumber(
                                  userpendingWithDrawal?.inr
                                    ? Number(userpendingWithDrawal.inr)
                                    : typeof userpendingWithDrawal === 'number'
                                      ? userpendingWithDrawal
                                      : 0
                                )
                              )}`
                            )}
                          </>
                        )}
                      </h2>
                    </div>
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </div>
      </div>
    </>
  );
};

export default WalletCards;
