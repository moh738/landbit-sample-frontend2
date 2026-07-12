import { ReactNode } from 'react';
import CommonButton from '../../ui/commonButton/CommonButton';
import './CommonHeading.scss';

const CommonHeading = ({
  heading,
  btntitle,
  description,
  className,
  onClick,
  svgIcon,
  disabled = false,
  required = false,
}: {
  onClick?: () => void;
  className?: string;
  svgIcon?: ReactNode;
  heading?: string | ReactNode;
  btntitle?: string | ReactNode;
  description?: string | ReactNode;
  disabled?: boolean;
  /** When true, shows a red asterisk (*) after the heading (same as mandatory form labels) */
  required?: boolean;
}) => {
  return (
    <div className={`commonHeading ${className || ''}`}>
      <h4>
        {heading}
        {required && <sup>*</sup>}
      </h4>
      {description && <p className="commonHeading_desc">{description}</p>}{' '}
      {btntitle && (
        <CommonButton
          title={btntitle}
          svgIcon={svgIcon}
          onClick={onClick}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default CommonHeading;
