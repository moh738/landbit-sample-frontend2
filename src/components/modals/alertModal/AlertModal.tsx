import NiceModal from '@ebay/nice-modal-react';
import { ReactNode } from 'react';
import { Form } from 'react-bootstrap';
import CommonModal from '../CommonModal';
import CommonButton from '../../ui/commonButton/CommonButton';
import './AlertModal.scss';

const AlertModal = NiceModal.create(
  ({
    closeAlertModal,
    icon,
    onClick,
    btntext,
    label,
    heading,
    subheading,
    btntitle,
    textarea,
    btncountinue,
    userlabel,
    username,
    className,
    btntextclassName,
    btncountinueclassName,
    btntextOnClick,
    btncountinueOnClick,
  }: {
    closeAlertModal: () => void;
    label: string;
    icon: ReactNode;
    onClick: () => void;
    heading: string;
    subheading: string;
    btntitle: string;
    textarea: any;
    btntext: string;
    btncountinue: string;
    userlabel: string;
    username: string;
    className: string;
    btntextclassName: string;
    btncountinueclassName: string;
    btntextOnClick?: () => void;
    btncountinueOnClick?: () => void;
  }) => {
    return (
      <CommonModal
        className={`alertmodal ${className || ''}`}
        show
        onHide={closeAlertModal}
      >
        {icon && icon}
        {heading && <h4>{heading}</h4>}
        {subheading && <p>{subheading}</p>}
        {userlabel && <span>{userlabel}</span>}
        {username && <h6>{username}</h6>}
        {textarea && (
          <div className="input_gruop">
            <label>{label}</label>
            <Form.Control as="textarea" rows={3} placeholder={textarea} />
          </div>
        )}
        {btntext && (
          <div className="btns">
            <CommonButton
              title={btntext}
              className={btntextclassName}
              onClick={btntextOnClick}
              fluid
            />
            <CommonButton
              title={btncountinue}
              className={btncountinueclassName}
              onClick={btncountinueOnClick}
              fluid
            />
          </div>
        )}
        {btntitle && <CommonButton title={btntitle} onClick={onClick} fluid />}
      </CommonModal>
    );
  }
);
export default AlertModal;
