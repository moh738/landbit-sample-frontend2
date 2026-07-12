import NiceModal from '@ebay/nice-modal-react';
import CommonButton from '../../ui/commonButton/CommonButton';
import CommonModal from '../CommonModal';
import './TermConditionModal.scss';

const TermConditionModal = NiceModal.create(
  ({ closeLogoutModal, onConfirm, onCancel }: any) => {
    return (
      <CommonModal className="logoutModal" show onHide={closeLogoutModal}>
        <h4>Terms & Conditions</h4>
        <div className="tc-content" style={{ marginBottom: '1rem' }}>
          <ul>
            <li>You must be at least 18 years old to use Landbitt.</li>
            <li>All information provided must be accurate and up to date.</li>
            <li>
              Landbitt is not responsible for any losses incurred during
              transactions.
            </li>
            <li>
              By signing up, you agree to receive emails related to your account.
            </li>
            <li>Your data will be handled according to our privacy policy.</li>
            <li>Misuse of the platform may result in account suspension.</li>
          </ul>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <CommonButton
            title="Cancel"
            onClick={() => {
              closeLogoutModal();
              if (onCancel) onCancel(); 
            }}
            fluid
          />
          <CommonButton
            title="Confirm"
            onClick={() => {
              closeLogoutModal();
              if (onConfirm) onConfirm(); 
            }}
            fluid
          />
        </div>
      </CommonModal>
    );
  }
);

export default TermConditionModal;
