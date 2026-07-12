import NiceModal from '@ebay/nice-modal-react';
import CommonButton from '../../ui/commonButton/CommonButton';
import CommonModal from '../CommonModal';
import { CongratulationsCheckIcon } from '../../../assets/icons/SvgIcon';
import './CongratulationsModal.scss';

const CongratulationsModal = NiceModal.create(
  ({
    closeCongratulationsModal,
    onClick,
    title,
    description,
    btntitle,
  }: {
    closeCongratulationsModal: () => void;
    onClick?: () => void;
    title: string;
    description: string;
    btntitle: string;
  }) => {
    return (
      <CommonModal
        className="congratulationsModal"
        show
        onHide={closeCongratulationsModal}
      >
        <span className="iconbg">
          <CongratulationsCheckIcon />
        </span>
        <h4>{title}</h4>
        <p>{description}</p>
        <CommonButton
          title={btntitle}
          onClick={() => {
            if (typeof onClick === 'function') {
              onClick();
            }
            closeCongratulationsModal();
          }}
          fluid
        />
      </CommonModal>
    );
  }
);
export default CongratulationsModal;
