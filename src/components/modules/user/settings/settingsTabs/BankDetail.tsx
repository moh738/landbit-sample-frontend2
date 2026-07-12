import { Col, Row } from 'react-bootstrap';
import CommonButton from '../../../../ui/commonButton/CommonButton';
import { useCallback, useEffect, useState } from 'react';
import { useModal } from '@ebay/nice-modal-react';
import upipayment from '../../../../../assets/images/upipayment.svg';
import CommonHeading from '../../../../common/commonHeading/CommonHeading';
import '../Settings.scss';
import { useBankDetails } from '../../../../../hooks/useBankDetail';
import { useSelector, useDispatch } from 'react-redux';
import { setShouldRefreshBankDetails } from '../../../../../redux/Slices/wallet.slice';
// import { truncateMiddle } from '../../../../../helpers/user/maskEmail';

const BankDetail = () => {
  const [bankDetails, setBankDetails] = useState<any | null>(null);
  const [upiDetails, setUpiDetails] = useState<any | null>(null);
  const [bankRequest, setBankRequest] = useState<boolean>(false);
  const [pendingPayment, setPendingPayment] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [previousBankStatus, setPreviousBankStatus] = useState<string | null>(null);
  const [previousUpiStatus, setPreviousUpiStatus] = useState<string | null>(null);
  const [upiHolderNameExpanded, setUpiHolderNameExpanded] = useState(false);
  const { fetchBankingDetails } = useBankDetails();
  const dispatch = useDispatch();
  const { bankStatus, shouldRefreshBankDetails } = useSelector(
    (state: RootState) => state?.wallet
  );

  const AddBankAccount = useModal('AddBankAccount');
  const closeAddBankAccount = useCallback(() => {
    AddBankAccount.remove();
  }, [AddBankAccount]);

  const AddUpiAccount = useModal('AddUpiAccount');
  const closeAddUpiAccount = useCallback(() => {
    AddUpiAccount.remove();
  }, [AddUpiAccount]);

  const loadBankDetails = useCallback(async () => {
    try {
      const res = await fetchBankingDetails(true);
      if (res?.success && res?.data) {
        setBankDetails(res?.data.approvedWallet);
        setUpiDetails(res?.data?.approvedWallet);
        setBankRequest(res?.data?.hasPendingRequest || false);
        setPendingPayment(res?.data?.pendingPaymentThrough || []);
        setPendingRequests(res?.data?.pendingRequests || []);
        setPreviousBankStatus(res?.data?.previousBankStatus ?? null);
        setPreviousUpiStatus(res?.data?.previousUpiStatus ?? null);
      }
    } catch (error) {
      console.error('Error preloading bank details:', error);
    }
  }, [fetchBankingDetails]);

  useEffect(() => {
    loadBankDetails();
  }, [loadBankDetails]);

  // Refresh bank details when socket event is received
  useEffect(() => {
    if (shouldRefreshBankDetails && bankStatus) {
      loadBankDetails();
      dispatch(setShouldRefreshBankDetails(false));
    }
  }, [shouldRefreshBankDetails, bankStatus, loadBankDetails, dispatch]);
  const pendingPaymentArray = Array.isArray(pendingPayment) ? pendingPayment : [];
  const pendingRequestsArray = Array.isArray(pendingRequests) ? pendingRequests : [];
  const pendingBankRequests = pendingRequestsArray?.filter(
    (req) => req?.bankName && req?.ifscCode && req?.status === 'Pending'
  );
  const pendingUpiRequests = pendingRequestsArray?.filter(
    (req) =>
      !req?.bankName &&
      !req?.ifscCode &&
      req?.accountNumber?.includes('@') &&
      req?.status === 'Pending'
  );
  const hasBankAccount = bankDetails?.accountNumber && bankDetails?.ifscCode;
  const hasUpiAccount =
    bankDetails?.accountNumber?.includes('@') || upiDetails?.upiId;
  const hasPendingBank = pendingBankRequests?.length > 0;
  const hasPendingUpi = pendingUpiRequests?.length > 0;
  const hasRejectedBank = pendingRequestsArray?.some(
    (req) =>
      req?.bankName &&
      req?.ifscCode &&
      (req?.status === 'Rejected' || req?.status === 'rejected')
  );
  const hasRejectedUpi = pendingRequestsArray?.some(
    (req) =>
      !req?.bankName &&
      !req?.ifscCode &&
      req?.accountNumber?.includes('@') &&
      (req?.status === 'Rejected' || req?.status === 'rejected')
  );
  const isPending = bankRequest === true || hasPendingBank || hasPendingUpi;
  const isBankPreviouslyRejected =
    previousBankStatus === 'Rejected' || previousBankStatus === 'rejected';
  const isUpiPreviouslyRejected =
    previousUpiStatus === 'Rejected' || previousUpiStatus === 'rejected';
  const isPreviousRejected = isBankPreviouslyRejected || isUpiPreviouslyRejected;
  const isRejected =
    isPreviousRejected ||
    hasRejectedBank ||
    hasRejectedUpi ||
    (bankRequest === false && !bankDetails && pendingPaymentArray?.length > 0);
  const getBankAccountStatus = () => {
    if (hasPendingBank) return 'pending';
    if (
      hasBankAccount &&
      bankDetails?.ifscCode &&
      !bankDetails?.accountNumber?.includes('@')
    )
      return 'approved';
    return null;
  };

  const getUpiAccountStatus = () => {
    if (hasPendingUpi) return 'pending';
    if (
      hasUpiAccount &&
      (bankDetails?.accountNumber?.includes('@') || upiDetails?.upiId)
    )
      return 'approved';
    return null;
  };

  const bankAccountStatus = getBankAccountStatus();
  const upiAccountStatus = getUpiAccountStatus();
  const getPendingMessage = () => {
    if (hasPendingBank && hasPendingUpi) {
      return {
        title: 'Bank & UPI Details Pending Approval',
        message:
          'Your Bank/UPI details are currently under review. Please wait for admin approval.',
      };
    } else if (hasPendingBank) {
      return {
        title: 'Bank/UPI  Details Pending Approval',
        message:
          'Your Bank/UPI  account details are currently under review. Please wait for admin approval.',
      };
    } else if (hasPendingUpi) {
      return {
        title: 'Bank/UPI  Details Pending Approval',
        message:
          'Your Bank/UPI  details are currently under review. Please wait for admin approval.',
      };
    } else {
      return {
        title: 'Bank/UPI Details Pending Approval',
        message:
          'Your bank/UPI details are currently under review. Please wait for admin approval.',
      };
    }
  };

  const pendingMessage = getPendingMessage();

  const getRejectedMessage = () => {
    // Use message from socket response if available (from admin rejection)
    if (bankStatus?.message && bankStatus?.status?.toLowerCase() === 'rejected') {
      const message = bankStatus.message;
      // Check if message contains specific rejection type
      if (message.includes('UPI') && !message.includes('Bank')) {
        return {
          title: 'Bank/UPI Details Rejected',
          message:
            'Your Bank/UPI details were rejected. Please update your details and resubmit.',
        };
      } else if (message.includes('Bank') && !message.includes('UPI')) {
        return {
          title: 'Bank/Bank/UPI Details Rejected',
          message:
            'Your Bank/UPI account details were rejected. Please update your details and resubmit.',
        };
      } else {
        return {
          title: message.includes('/') ? 'Bank/UPI Details Rejected' : message,
          message: 'Please update your details and resubmit.',
        };
      }
    }

    // Fallback: determine message based on rejected requests or previousStatus
    let bankRejected = hasRejectedBank;
    let upiRejected = hasRejectedUpi;

    // If previousStatus is Rejected, determine what was rejected
    if (isPreviousRejected && !hasRejectedBank && !hasRejectedUpi) {
      // If user has approved accounts, those were rejected
      // If user has no accounts, it means first time rejection
      if (hasBankAccount && hasUpiAccount) {
        bankRejected = true;
        upiRejected = true;
      } else if (hasBankAccount) {
        bankRejected = true;
      } else if (hasUpiAccount) {
        upiRejected = true;
      } else {
        // First time rejection - no accounts exist
        // Check if there are any pending requests to determine type
        const hasPendingBankReq = pendingBankRequests?.length > 0;
        const hasPendingUpiReq = pendingUpiRequests?.length > 0;
        if (hasPendingBankReq && hasPendingUpiReq) {
          bankRejected = true;
          upiRejected = true;
        } else if (hasPendingBankReq) {
          bankRejected = true;
        } else if (hasPendingUpiReq) {
          upiRejected = true;
        } else {
          // Default to both if we can't determine
          bankRejected = true;
          upiRejected = true;
        }
      }
    }

    if (bankRejected && upiRejected) {
      return {
        title: 'Bank/UPI Details Rejected',
        message:
          'Your Bank/UPI details were rejected. Please update your details and resubmit.',
      };
    } else if (bankRejected) {
      return {
        title: 'Bank/UPI Details Rejected',
        message:
          'Your Bank/UPI account details were rejected. Please update your details and resubmit.',
      };
    } else if (upiRejected) {
      return {
        title: 'Bank/UPI Details Rejected',
        message:
          'Your Bank/UPI details were rejected. Please update your details and resubmit.',
      };
    } else {
      return {
        title: 'Bank/UPI Details Rejected',
        message:
          'Your Bank/UPI details were rejected. Please update your details and resubmit.',
      };
    }
  };

  const rejectedMessage = getRejectedMessage();

  return (
    <>
      <section className="bankdetails">
        <p className="bankdetails_text">
          Deposits and withdrawals are allowed only through your linked bank account
          or UPI ID. Transactions from other accounts will be declined
        </p>

        {isPending && (
          <div
            className="status-message pending-message"
            style={{
              padding: '1.2rem',
              marginBottom: '2rem',
              borderRadius: '0.8rem',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ fontSize: '1.4rem' }}>ℹ️</span>
              <div>
                <h6 style={{ margin: 0, marginBottom: '0.4rem', fontWeight: 600 }}>
                  {pendingMessage.title}
                </h6>
                <p style={{ margin: 0, color: '#856404' }}>
                  {pendingMessage.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {isRejected && (
          <div
            className="status-message rejected-message"
            style={{
              padding: '1.2rem',
              marginBottom: '2rem',
              borderRadius: '0.8rem',
              backgroundColor: '#f8d7da',
              border: '1px solid #dc3545',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ fontSize: '1.4rem' }}>⚠️</span>
              <div>
                <h6 style={{ margin: 0, marginBottom: '0.4rem', fontWeight: 600 }}>
                  {rejectedMessage?.title}
                </h6>
                <p style={{ margin: 0, color: '#721c24' }}>
                  {rejectedMessage?.message}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="add_btn">
          {!hasBankAccount && (
            <CommonButton
              title="+ Add Bank Account"
              className="btn-secondry"
              disabled={hasPendingBank}
              onClick={() => {
                AddBankAccount.show({
                  closeAddBankAccount,
                  onSuccess: loadBankDetails,
                });
              }}
            />
          )}

          {!hasUpiAccount && (
            <CommonButton
              title="Add UPI Payment"
              className="btn-secondry"
              imageIcon={upipayment}
              disabled={hasPendingUpi}
              onClick={() => {
                AddUpiAccount.show({
                  closeAddUpiAccount,
                  onSuccess: loadBankDetails,
                });
              }}
            />
          )}
        </div>

        {previousBankStatus === 'Pending' && pendingBankRequests?.length > 0 && (
          <div className="account_detail">
            <CommonHeading heading="Pending Bank Account Requests" />
            <Row>
              {pendingBankRequests?.map((pendingBank, index) => (
                <Col lg={5} key={index}>
                  <div className="account_detail_inner">
                    <img
                      src={pendingBank?.bankIcon || bankDetails?.bankIcon}
                      alt="img"
                    />
                    <div className="account_detail_inner_text">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <h6 style={{ margin: 0 }}>{pendingBank?.bankName}</h6>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem 1rem',
                            borderRadius: '0.6rem',
                            backgroundColor: '#fff3cd',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.9rem',
                              color: '#856404',
                              lineHeight: 1,
                            }}
                          >
                            ⏳
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: '#856404',
                            }}
                          >
                            Pending Approval
                          </span>
                        </div>
                      </div>
                      <p>{pendingBank?.accountNumber}</p>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: '#856404',
                          marginTop: '0.5rem',
                        }}
                      >
                        {/* IFSC: {pendingBank?.ifscCode} */}
                      </p>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: '#856404',
                          wordBreak: 'break-all',
                        }}
                        title={pendingBank?.holderName}
                      >
                        Holder:{pendingBank?.holderName}
                      </p>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Pending UPI Requests */}
        {previousUpiStatus === 'Pending' && pendingUpiRequests?.length > 0 && (
          <div className="account_detail">
            <CommonHeading heading="Pending UPI Payment Requests" />
            <Row>
              {pendingUpiRequests.map((pendingUpi, index) => (
                <Col lg={5} key={index}>
                  <div className="account_detail_inner">
                    <img src={upipayment} alt="img" />
                    <div className="account_detail_inner_text">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <h6
                          style={{ margin: 0 }}
                          title={pendingUpi?.holderName || undefined}
                        >
                          {pendingUpi?.holderName}
                        </h6>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem 1rem',
                            borderRadius: '0.6rem',
                            backgroundColor: '#fff3cd',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.9rem',
                              color: '#856404',
                              lineHeight: 1,
                            }}
                          >
                            ⏳
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: '#856404',
                            }}
                          >
                            Pending Approval
                          </span>
                        </div>
                      </div>
                      <p>{pendingUpi?.accountNumber}</p>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}
        {hasBankAccount && bankAccountStatus === 'approved' && (
          <div className="account_detail">
            <CommonHeading heading="Account" />
            <Row>
              <Col lg={5}>
                <div className="account_detail_inner">
                  <img src={bankDetails?.bankIcon} alt="img" />
                  <div className="account_detail_inner_text">
                    <div className="account_header">
                      <h6 style={{ margin: 0 }}>
                        {bankDetails?.bankName || 'Bank Account'}
                      </h6>
                      {bankAccountStatus === 'approved' && (
                        <div className="approved_badge">
                          <span className="check_icon">✓</span>
                          <span className="badge_text">
                            {isBankPreviouslyRejected ? 'Last Approved' : 'Approved'}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="account_number">{bankDetails?.accountNumber}</p>
                    {bankDetails?.ifscCode && (
                      <p className="ifsc_code">IFSC: {bankDetails?.ifscCode}</p>
                    )}
                    <div className="action_btn">
                      <CommonButton
                        title="Edit"
                        className="btn-md action_btn-lightlue"
                        onClick={() => {
                          AddBankAccount.show({
                            closeAddBankAccount,
                            onSuccess: async () => {
                              await loadBankDetails();
                            },
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
        {hasUpiAccount && upiAccountStatus === 'approved' && (
          <div className="account_detail">
            <CommonHeading heading="UPI Payment List" />
            <Row>
              <Col lg={5}>
                <div className="account_detail_inner">
                  <img src={upipayment} alt="img" />
                  <div className="account_detail_inner_text">
                    <div className="account_header">
                      <h6 style={{ margin: 0 }} className="account_holder_name_wrap">
                        {(() => {
                          const holderName =
                            bankDetails?.holderName || upiDetails?.holderName || '';
                          const maxLength = 25;
                          if (!holderName || holderName.length <= maxLength) {
                            return holderName || '-';
                          }
                          const isExpanded = upiHolderNameExpanded;
                          const displayText = isExpanded
                            ? holderName
                            : `${holderName.slice(0, maxLength)}...`;
                          return (
                            <span className="holder_name_with_toggle">
                              <span className="holder_name_text" title={holderName}>
                                {displayText}
                              </span>
                              <button
                                type="button"
                                className="holder_name_toggle"
                                onClick={() =>
                                  setUpiHolderNameExpanded((prev) => !prev)
                                }
                              >
                                {isExpanded ? 'View less' : 'View more'}
                              </button>
                            </span>
                          );
                        })()}
                      </h6>
                      {upiAccountStatus === 'approved' && (
                        <div className="approved_badge">
                          <span className="check_icon">✓</span>
                          <span className="badge_text">
                            {isUpiPreviouslyRejected ? 'Last Approved' : 'Approved'}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="account_number">
                      {bankDetails?.accountNumber?.includes('@')
                        ? bankDetails?.accountNumber
                        : upiDetails?.upiId}
                    </p>
                    <div className="action_btn">
                      <CommonButton
                        title="Edit"
                        className="btn-md action_btn-lightlue"
                        onClick={() => {
                          AddUpiAccount.show({
                            closeAddUpiAccount,
                            onSuccess: async () => {
                              await loadBankDetails();
                            },
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </section>
    </>
  );
};

export default BankDetail;
