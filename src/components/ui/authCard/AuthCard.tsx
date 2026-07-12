import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AuthCard.scss';
import { BackArrowIcon } from '../../../assets/icons/SvgIcon';
import { normalizePath } from '../../../helpers/path/normalizePath';
import { useSelector } from 'react-redux';
const AuthCard = ({
  className,
  title,
  subTitle,
  backTo,
  onClickBack,
  children,
}: {
  title?: ReactNode;
  subTitle?: ReactNode;
  className?: string;
  backTo?: any;
  onClickBack?: any;
  children?: ReactNode;
}) => {
  const location = useLocation();
  const currentPath = normalizePath(location.pathname);

  const { isBlockedForOTPs } = useSelector((state: RootState) => state.user);

  return (
    <div className={`auth_card ${className || ''}`}>
      {(backTo || onClickBack) && (
        <div className="auth_card_back">
          <Link to={backTo} onClick={onClickBack}>
            <BackArrowIcon />
            {currentPath === '/login/otp'
              ? 'Back to Sign In'
              : currentPath === '/sign-up/otp'
                ? 'Back to Sign Up'
                : currentPath === '/forgot-password/otp'
                  ? 'Back to Forgot Password'
                  : 'Back'}
          </Link>
        </div>
      )}
      {!isBlockedForOTPs && <h3 className="auth_card_title">{title}</h3>}
      {!isBlockedForOTPs && <p className="auth_card_subtitle">{subTitle}</p>}
      <div className={`auth_card ${className ? `${className}_inner` : ''}`}>
        {children}
      </div>
    </div>
  );
};
export default AuthCard;
