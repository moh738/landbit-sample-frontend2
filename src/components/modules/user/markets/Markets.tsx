import CommonHeading from '../../../common/commonHeading/CommonHeading';
import { useCallback, useEffect, useState } from 'react';
import TabsComponent from '../../../ui/tabsComponent/TabsComponent';
import MarketsOwnership from './MarketsOwnership';
import { HeadphoneIcon } from '../../../../assets/icons/SvgIcon';
import { useModal } from '@ebay/nice-modal-react';
import './Markets.scss';
import { useLocation, useNavigate } from 'react-router-dom';
// import {  useSelector } from 'react-redux';
// import { setEquityEnable } from '../../../../redux/Slices/user.slice';

const Markets = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // const dispatch = useDispatch();
  // const equityEnable = useSelector((state: RootState) => state?.user?.equityEnable);
  // console.log('equityEnable========>', equityEnable);
  
  
  const tabItems = [
    { key: 'FRACTIONAL', label: 'Fractional Ownership' },
    { key: 'FULL', label: 'Full Ownership' },
  ];
  const PropertyAdvisorSupport = useModal('PropertyAdvisorSupport');
  const closePropertyAdvisorSupport = useCallback(() => {
    PropertyAdvisorSupport.remove();
  }, [PropertyAdvisorSupport]);
  
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'FRACTIONAL';
  
  const handleTabSelect = (key: string) => {
    setActiveTab(key);
    navigate(`?tab=${key}`, { replace: true });
  };
  const [activeTab, setActiveTab] = useState(initialTab);

  // // Set Equity Mode to false by default when component mounts
  // useEffect(() => {
  //   dispatch(setEquityEnable(false));
  // }, [dispatch]);

  // // Console log equityEnable value whenever it changes
  // useEffect(() => {
  //   console.log('Equity Enable value:', equityEnable);
  // }, [equityEnable]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') || 'FRACTIONAL';
    setActiveTab(tab);
  }, [location.search]);



  return (
    <section className="markets">
      <CommonHeading
        heading="Primary Marketplace"
        svgIcon={<HeadphoneIcon />}
        // btntitle="property advisory support"
        disabled={true}
        onClick={() => {
          PropertyAdvisorSupport.show({
            closePropertyAdvisorSupport,
          });
        }}
      />
      <TabsComponent
        activeTab={activeTab}
        onSelect={(key) => handleTabSelect(key ?? 'FRACTIONAL')}
        tabItems={tabItems}
        className="markets_tabs"
        showToggle
        text="Equity Mode"
      />

      <div className="tab_content">
        <MarketsOwnership activeTab={activeTab} />
      </div>
    </section>
  );
};

export default Markets;
