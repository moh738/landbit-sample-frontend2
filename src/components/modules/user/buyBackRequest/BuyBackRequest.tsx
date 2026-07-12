import { Col, Row } from 'react-bootstrap';
import { useState } from 'react';
import {
  DiamondIcon,
  ReturnIcon,
  TotalInvestmentsIcon,
} from '../../../../assets/icons/SvgIcon';
import CommonHeading from '../../../common/commonHeading/CommonHeading';
import StatsCard from '../dashboard/statsCard/StatsCard';
import './BuyBackRequest.scss';
import FullPropertyTable from './fullPropertyTable/FullPropertyTable';

const BuyBackRequest = () => {
  const [stats, setStats] = useState<{
    totalCount: number;
    activeCount: number;
    closedCount: number;
    upcomingCount: number;
  }>({
    totalCount: 0,
    activeCount: 0,
    closedCount: 0,
    upcomingCount: 0,
  });

  const handleStatsChange = (newStats: {
    totalCount?: number;
    activeCount?: number;
    closedCount?: number;
    upcomingCount?: number;
  }) => {
    setStats((prev) => ({
      totalCount: newStats?.totalCount ?? prev.totalCount,
      activeCount: newStats?.activeCount ?? prev.activeCount,
      closedCount: newStats?.closedCount ?? prev.closedCount,
      upcomingCount: newStats?.upcomingCount ?? prev.upcomingCount,
    }));
  };

  const bookingCard = [
    {
      icon: <DiamondIcon />,
      value: String(stats?.totalCount || 0),
      subtitle: 'Total Requests',
    },
    {
      icon: <TotalInvestmentsIcon />,
      value: String(stats?.activeCount || 0),
      subtitle: 'Approved Requests',
      className: 'lightblueclr',
    },
    {
      icon: <ReturnIcon />,
      // Treat upcoming as pending for card display
      value: String(stats?.upcomingCount || 0),
      subtitle: 'Upcoming Requests',
      className: 'lightpurpleclr',
    },
  ];

  return (
    <>
      <section className="buybackrequest">
        <div className="buybackrequest_head">
          <CommonHeading heading="Buyback Request" />
        </div>

        <div className="buybackrequest_cards">
          <Row className="mb-4 mb-md-0">
            {bookingCard?.map((item, index) => (
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

        <div className="tab_content">
          <FullPropertyTable onStatsChange={handleStatsChange} />
        </div>
      </section>
    </>
  );
};

export default BuyBackRequest;
