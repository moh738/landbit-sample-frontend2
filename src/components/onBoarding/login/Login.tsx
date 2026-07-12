import CommonVerification from '../commonVerification/commonVerification';
import LoginPage from './loginPage';
import { maskEmail } from '../../../helpers/user/maskEmail';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Login.scss';
import { useEffect, useState } from 'react';
import { normalizePath } from '../../../helpers/path/normalizePath';
import { useAuthentication } from '../../../hooks/authenticationHooks/useAuthentication';

const Login = () => {
  const navigate = useNavigate();
  const { loginEmail } = useSelector((state: RootState) => state.loginProgress);
  const location = useLocation();
  const currentPath = normalizePath(location.pathname);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const { handleLogout } = useAuthentication();

  useEffect(() => {
    if (!loginEmail) {
      handleLogout();
    } else {
      setMaskedEmail(maskEmail(loginEmail));
    }
  }, [loginEmail, navigate]);

  return (
    <>
      {currentPath === '/' || currentPath === '/login' ? (
        <LoginPage />
      ) : currentPath === '/login/otp' ? (
        <CommonVerification
          context="login"
          onClickBack={() => {
            navigate('/login');
          }}
          backTo={'/login'}
          title=""
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
export default Login;
