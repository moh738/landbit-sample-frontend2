import { ReactNode, useEffect } from 'react';
import CommonOTP from '../../formik/otp/CommonOTP';
import AuthCard from '../../ui/authCard/AuthCard';
import { OTPContext } from '../../../constants/redux/auth/authConstants';
import { useSelector } from 'react-redux';
import { useAuthentication } from '../../../hooks/authenticationHooks/useAuthentication';
import { useNavigate } from 'react-router';

const CommonVerification = ({
  className,
  title,
  subTitle,
  backTo,
  onClickBack,
  context,
}: {
  title: string;
  subTitle?: ReactNode;
  className?: string;
  backTo?: any;
  onClickBack?: any;
  context: OTPContext;
}) => {
  const { signUpEmail } = useSelector((state: RootState) => state.signUpProgress);

  const { loginEmail } = useSelector((state: RootState) => state.loginProgress);

  const { forgotPasswordEmail } = useSelector(
    (state: RootState) => state.forgotPasswordProgress
  );

  const navigate = useNavigate();
  const { handleLogout } = useAuthentication();

  useEffect(() => {
    if (!signUpEmail && !forgotPasswordEmail && !loginEmail) {
      handleLogout();
    }
  }, [signUpEmail, forgotPasswordEmail, loginEmail, navigate]);

  return (
    <AuthCard
      className={className}
      title={`OTP Verification ${title}`}
      subTitle={subTitle}
      onClickBack={onClickBack}
      backTo={backTo}
    >
      <CommonOTP context={context} />
    </AuthCard>
  );
};

export default CommonVerification;
