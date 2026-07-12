import NiceModal from '@ebay/nice-modal-react';
import CommonModal from '../CommonModal';
import qr_code from '../../../assets/images/qr_code.png';
import './QrCodeModal.scss';

const QrCodeModal = NiceModal.create(
  ({ closeQrCodeModal }: { closeQrCodeModal: () => void }) => {
    return (
      <CommonModal className="qrCodeModal" show onHide={closeQrCodeModal}>
        <h4>QR Code</h4>
        <div className="qrCodeModal_wrap">
          <div className="qr_code">
            <p>Scan to deposit</p>
            <div className="qr_code_img">
              <img src={qr_code} alt="qr-code" />
            </div>
          </div>
          <div className="imp_method">
            <h5>Important</h5>
            <ul>
              <li>Withdraw funds to your UPI address only.</li>
              <li>Transactions may take 10-30 minutes to reflect.</li>
            </ul>
          </div>
        </div>
      </CommonModal>
    );
  }
);
export default QrCodeModal;
