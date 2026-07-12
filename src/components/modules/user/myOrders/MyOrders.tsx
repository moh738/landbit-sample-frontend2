import CommonHeading from '../../../common/commonHeading/CommonHeading';
import TabsComponent from '../../../ui/tabsComponent/TabsComponent';
import { useState,  useEffect } from 'react';
import CompletedTable from './ordersInvestTable/CompletedTable';
import PendingTable from './ordersInvestTable/PendingTable';
import RejectedTable from './ordersInvestTable/RejectedTable';
import { useSearchParams } from 'react-router-dom';
import './MyOrders.scss';

const MyOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams?.get('tab');

  const getTabFromUrl = (tab: string | null): string => {
    if (!tab) return 'Pending';
    const lowerTab = tab.toLowerCase();
    if (lowerTab === 'pending') return 'Pending';
    if (lowerTab === 'completed') return 'Completed';
    if (lowerTab === 'rejected') return 'Rejected';
    return 'Pending';
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromUrl(urlTab));

  const tabItems = [
    { key: 'Completed', label: 'Completed' },
    { key: 'Pending', label: 'Pending Approvals' },
    { key: 'Rejected', label: 'Rejected' },
  ];


  useEffect(() => {
    const currentUrlTab = searchParams.get('tab');
    if (currentUrlTab) {
      const tab = getTabFromUrl(currentUrlTab);
      setActiveTab(tab);
    }
  }, [searchParams]);


  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'pending' }, { replace: true });
    }
  }, []);

  const handleTabSelect = (key: string | null) => {
    const selectedTab = key ?? 'Pending';
    setActiveTab(selectedTab);
    setSearchParams({ tab: selectedTab.toLowerCase() });
  };


  // useLayoutEffect(() => {
  //   document.title = activeTab;
  // }, [activeTab]);

  return (
    <section className="orders">
      <CommonHeading heading="My Orders" />
      <TabsComponent
        activeTab={activeTab}
        onSelect={handleTabSelect}
        tabItems={tabItems}
        className="orders_tabs"
      />

      <div className="tab_content">
        {activeTab === 'Pending' && <PendingTable activeTab={activeTab} />}
        {activeTab === 'Completed' && <CompletedTable activeTab={activeTab} />}
        {activeTab === 'Rejected' && <RejectedTable activeTab={activeTab} />}
      </div>
    </section>
  );
};

export default MyOrders;
