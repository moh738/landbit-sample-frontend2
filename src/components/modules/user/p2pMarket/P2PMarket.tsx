import CommonHeading from '../../../common/commonHeading/CommonHeading';
import ComingSoon from '../../../common/comingSoon/ComingSoon';
import './P2PMarket.scss';
import { PMarketIcon } from '../../../../assets/icons/SvgIcon';

const P2PMarket = () => {
  return (
    <section className="p2p_market">
      <CommonHeading
        heading="P2P Market"
        svgIcon={<PMarketIcon />}
      />
      <div className="p2p_market_content">
        <ComingSoon />
      </div>
    </section>
  );
};

export default P2PMarket;
