import CommonVerification from '../commonVerification/commonVerification';
import SignUp from './SignUp';
import { useSelector } from 'react-redux';
import { maskEmail } from '../../../helpers/user/maskEmail';
import './SignUp.scss';
import { useLocation, useNavigate } from 'react-router-dom';
import { normalizePath } from '../../../helpers/path/normalizePath';
import { useEffect, useState } from 'react';

const SignUpPage = () => {
  const { signUpEmail } = useSelector((state: RootState) => state.signUpProgress);

  const location = useLocation();
  const navigate = useNavigate();
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const currentPath = normalizePath(location.pathname);

  useEffect(() => {
    if (signUpEmail) {
      setMaskedEmail(maskEmail(signUpEmail));
    }
  }, [signUpEmail, navigate]);

  return (
    <>
      {currentPath === '/sign-up' ? (
        <SignUp />
      ) : currentPath === '/sign-up/otp' ? (
        <CommonVerification
          context="signup"
          backTo={'/sign-up'}
          title="email"
          subTitle={
            <>
              Please enter the verification code we’ve sent to{' '}
              <span>{maskedEmail}</span>
            </>
          }
        />
      ) : (
        ''
      )}
    </>
  );
};

export default SignUpPage;
