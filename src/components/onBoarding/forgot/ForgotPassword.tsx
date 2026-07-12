import CommonVerification from '../commonVerification/commonVerification';
import ChangePassword from './ChangePassword';
import ForgotPage from './ForgotPage';
import { maskEmail } from '../../../helpers/user/maskEmail';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';
import { normalizePath } from '../../../helpers/path/normalizePath';
import { useEffect, useState } from 'react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const { forgotPasswordEmail } = useSelector(
    (state: RootState) => state?.forgotPasswordProgress
  );
  const location = useLocation();
  const currentPath = normalizePath(location?.pathname);


  useEffect(() => {
    if (forgotPasswordEmail) {
      setMaskedEmail(maskEmail(forgotPasswordEmail));
    }
  }, [forgotPasswordEmail, navigate]);

  return (
    <>
      {currentPath === '/forgot-password' ? (
        <ForgotPage />
      ) : currentPath === '/forgot-password/otp' ? (
        <CommonVerification
          context="forgotPassword"
          onClickBack={() => {
            navigate('/forgot-password');
          }}
          backTo={'/forgot-password'}
          title=""
          subTitle={
            <>
              We’ve sent a 6-digit Verification Code to your Registered Email :
              {maskedEmail}
            </>
          }
        />
      ) : currentPath === '/forgot-password/change-password' ? (
        <ChangePassword
          onClickBack={() => {
            navigate('/forgot-password');
          }}
        />
      ) : (
        ''
      )}
    </>
  );
};
export default ForgotPassword;
