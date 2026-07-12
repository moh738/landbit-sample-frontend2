import { Col, Row } from 'react-bootstrap';
import {
  DiamondIcon,
  RentalIcon,
  ReturnIcon,
  TotalInvestmentsIcon,
} from '../../../../assets/icons/SvgIcon';
import CommonHeading from '../../../common/commonHeading/CommonHeading';
import StatsCard from '../dashboard/statsCard/StatsCard';
import TabsComponent from '../../../ui/tabsComponent/TabsComponent';
import { useState } from 'react';
import AdvisorRequestTable from './advisorRequestTable/AdvisorRequestTable';
import SiteRequestTable from './advisorRequestTable/SiteRequestTable';
import './MyBooking.scss';
import CustomPagination from '../../../common/customPagination/CustomPagination';

const MyBooking = () => {
  const [activeTab, setActiveTab] = useState('property');
  const bookingCard = [
    {
      icon: <DiamondIcon />,
      value: '1',
      subtitle: 'Current Value',
    },
    {
      icon: <TotalInvestmentsIcon />,
      value: '2',
      subtitle: 'Total Invested',
      className: 'lightblueclr',
    },
    {
      icon: <ReturnIcon />,
      value: '1',
      subtitle: 'Total Return',
      className: 'lightpurpleclr',
    },
    {
      icon: <RentalIcon />,
      value: '0',
      subtitle: 'Rental Income',
      className: 'lightgreenclr',
    },
  ];

  const tabItems = [
    { key: 'property', label: 'Property advisor request' },
    { key: 'site', label: 'Site Visit Request' },
  ];

  return (
    <section className="booking">
      <CommonHeading heading="My Booking" />
      <div className="booking_cards">
        <Row className="mb-4 mb-md-0">
          {bookingCard.map((item, index) => (
            <Col key={index} xl={3} lg={4} xs={6}>
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
      <TabsComponent
        activeTab={activeTab}
        onSelect={(key) => setActiveTab(key ?? 'property')}
        tabItems={tabItems}
        className="booking_tabs"
      />

      <div className="tab_content">
        {activeTab === 'property' && <AdvisorRequestTable />}
        {activeTab === 'site' && <SiteRequestTable />}
      </div>
      <CustomPagination pageCount={5} />
    </section>
  );
};

export default MyBooking;
