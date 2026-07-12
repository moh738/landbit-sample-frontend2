import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { InfoIcon } from '../../../assets/icons/SvgIcon';
import './CustomTooltip.scss';

const CustomTooltip = (data: string) => {
  return (
    <>
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id="tooltip-eye-icon" className="tooltip" show={true}>
            {data}
          </Tooltip>
        }
      >
        <button role="button" tabIndex={0} className="info_icon_button">
          <InfoIcon />
        </button>
      </OverlayTrigger>
    </>
  );
};

export default CustomTooltip;
