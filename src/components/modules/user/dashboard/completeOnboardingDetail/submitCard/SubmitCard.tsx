import CommonHeading from '../../../../../common/commonHeading/CommonHeading';
import CommonButton from '../../../../../ui/commonButton/CommonButton';
import './SubmitCard.scss';

const SubmitCard = (props: any) => {
  return (
    <div className="kyc_review">
      {props.heading && <CommonHeading heading={props.heading} />}
      <div className={`kyc_review_main ${props.className || ''}`}>
        <div className="kyc_review_main_head">
          {props.btntext && (
            <CommonButton
              title={props.btntext}
              onClick={props.onClick}
              type="submit"
              className="edit_btn"
            />
          )}
        </div>
        <div className="kyc_review_main_content">{props.children}</div>
      </div>
    </div>
  );
};

export default SubmitCard;
