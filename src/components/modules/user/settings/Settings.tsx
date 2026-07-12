import CommonHeading from '../../../common/commonHeading/CommonHeading';
import TabsComponent from '../../../ui/tabsComponent/TabsComponent';
import { useCallback, useEffect, useState } from 'react';
import GeneralSettings from './settingsTabs/GeneralSettings';
import './Settings.scss';
import { useModal } from '@ebay/nice-modal-react';
import BankDetail from './settingsTabs/BankDetail';
import KybDetail from './settingsTabs/KybDetail';
import KycDetail from './settingsTabs/KycDetail';
import { useSelector } from 'react-redux';
import { useBankDetails } from '../../../../hooks/useBankDetail';
import Toast from '../../../common/Toast';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useOnboardingStatus } from '../../../../hooks/authenticationHooks/useOnboardngStatus';
import InCompleteAlert from '../../../ui/inCompleteAlert/InCompleteAlert';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('');
  const { accountType, cryptoEnable } = useSelector((state: RootState) => state?.user?.profile);
  const { onBoardingStatus } = useSelector((state: RootState) => state.onboarding);
  const { fetchBankingDetails } = useBankDetails();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { blurContent } = useOnboardingStatus();

  const isKycVerified = onBoardingStatus === 'Verified';
  const shouldBlur = blurContent(pathname, onBoardingStatus);

  const tabItems = [
    ...(cryptoEnable
      ? []
      : [
          { key: 'bankdetails', label: 'Bank Details' },
          { key: 'general', label: 'General Settings' },
        ]),
    ...(accountType === 'Institutional'
      ? [{ key: 'Kybdetail', label: 'KYB Details' }]
      : []),
    ...(accountType === 'Individual'
      ? [{ key: 'Kycdetail', label: 'KYC Details' }]
      : []),
  ];
  
  const checkUserDetails = useCallback(
    async (isAutoCheck = true) => {
      // Skip bank details and PAN card checks if crypto is enabled
      if (cryptoEnable) {
        // When crypto is enabled, only show KYC/KYB tab
        const defaultTab = accountType === 'Institutional' ? 'Kybdetail' : 'Kycdetail';
        setActiveTab(defaultTab);
        setSearchParams({ tab: defaultTab });
        return;
      }

      try {
        const res = await fetchBankingDetails(true);

        if (!res?.success || !res?.data?.approvedWallet) {
          if (isAutoCheck) 
            // Toast.info('Kindly add your bank details!');
          setActiveTab('bankdetails');
          setSearchParams({ tab: 'bankdetails' });
          return;
        }

        const { holderName, accountNumber, ifscCode, bankName, upiId } =
          res?.data?.approvedWallet;

        const hasFullBank = holderName && accountNumber && ifscCode && bankName;
        const hasUpiOnly = upiId && !hasFullBank;

        if (!hasFullBank && !hasUpiOnly) {
          if (isAutoCheck)
            // Toast.info('Kindly add your bank details!');
            setActiveTab('bankdetails');
          setSearchParams({ tab: 'bankdetails' });
          return;
        }
        setActiveTab('bankdetails');
        setSearchParams({ tab: 'bankdetails' });
      } catch (err) {
        console.error('Bank detail fetch failed:', err);
        if (isAutoCheck) Toast.info('Kindly add your bank details!');
        setActiveTab('bankdetails');
        setSearchParams({ tab: 'bankdetails' });
      }
    },
    [fetchBankingDetails, setSearchParams, cryptoEnable, accountType]
  );

  useEffect(() => {
    const urlTab = searchParams.get('tab');

    if (urlTab) {
      // If crypto is enabled, redirect bankdetails/general tabs to KYC/KYB
      if (cryptoEnable && (urlTab === 'bankdetails' || urlTab === 'general')) {
        const defaultTab = accountType === 'Institutional' ? 'Kybdetail' : 'Kycdetail';
        setActiveTab(defaultTab);
        setSearchParams({ tab: defaultTab });
      } else {
        setActiveTab(urlTab);
      }
    } else {
      checkUserDetails(); 
    }
  }, [cryptoEnable, accountType, searchParams, checkUserDetails, setSearchParams]);

  const handleTabChange = (key: string) => {
    if (!isKycVerified) {
      return;
    }
    setActiveTab(key);
    setSearchParams({ tab: key }); 
  };

  const ChangePasswordModal = useModal('ChangePasswordModal');
  const closeChangePasswordModal = useCallback(() => {
    ChangePasswordModal.remove();
  }, [ChangePasswordModal]);

  const onChangePassword = () => {
    ChangePasswordModal.show({ closeChangePasswordModal, navigate });
  };



    return (
    <>
      {shouldBlur && (
        <InCompleteAlert status={onBoardingStatus} />
      )}
      <CommonHeading
        btntitle="Change Password"
        // heading="Settings"
        onClick={onChangePassword}
      />
      <section className={`settings ${shouldBlur ? 'glassmorphism' : ''}`}>
        {/* Tabs */}
        <TabsComponent
          activeTab={activeTab}
          onSelect={(key) => key && handleTabChange(key)}
          tabItems={tabItems.map((tab) => ({ ...tab, disabled: !isKycVerified }))}
          className="settings_tabs"
        />

        <div className="tab_content">
          {!cryptoEnable && activeTab === 'bankdetails' && <BankDetail />}
          {!cryptoEnable && activeTab === 'general' && <GeneralSettings />}
          {accountType === 'Institutional' && activeTab === 'Kybdetail' && (
            <KybDetail activeTab={activeTab} />
          )}
          {accountType === 'Individual' && activeTab === 'Kycdetail' && (
            <KycDetail activeTab={activeTab} />
          )}
        </div>
      </section>
    </>
  );
};

export default Settings;
