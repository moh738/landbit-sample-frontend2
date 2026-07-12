import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useModal } from '@ebay/nice-modal-react';
import AlertModal from '../../modals/alertModal/AlertModal';
import {
  INDIVIDUAL,
  INSTITUTIONAL,
} from '../../../constants/redux/auth/authConstants';
import store from '../../../redux/Store';
import { ROUTES } from '../../../utils/Utils';

interface ReasonButtonProps {
  reason: string;
}

const ReasonButton: React.FC<ReasonButtonProps> = ({ reason }) => {
  const ReasonModal = useModal(AlertModal);
  const navigate = useNavigate();
  const openReasonModal = () => {
    ReasonModal.show({
      closeAlertModal: () => ReasonModal.remove(),
      heading: 'Rejection Reason',
      subheading: reason,
      btntext: 'Cancel',
      btncountinue: 'Retry',
      btntextclassName: 'cancel-btn',
      btncountinueclassName: 'retry-btn',
      btntextOnClick: () => {
        ReasonModal.remove();
      },
      btncountinueOnClick: () => {
        ReasonModal.remove();
        const accountType = store.getState().user.profile?.accountType ?? INDIVIDUAL;
        if (accountType === INDIVIDUAL) {
          navigate(`/${ROUTES.USER}/${ROUTES.DASHBOARD}/${ROUTES.COMPLETE_KYC_ONBOARDING}`);
        } else if (accountType === INSTITUTIONAL) {
          navigate(`/${ROUTES.USER}/${ROUTES.DASHBOARD}/${ROUTES.COMPLETE_KYB_ONBOARDING}`);
        } else {
          navigate(`/${ROUTES.USER}`);
        }
      },
    });
  };

  return (
    <Link to="#" onClick={openReasonModal} style={{ cursor: 'pointer' }}>
      View
    </Link>
  );
};

export default ReasonButton;
