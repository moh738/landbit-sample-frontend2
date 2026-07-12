// @ts-ignore
import OTPInput from 'otp-input-react';
import { useEffect, useRef, useState } from 'react';
import './CommonOTP.scss';
import { useNavigate } from 'react-router-dom';
import { useVerifyOTP } from '../../../hooks/authenticationHooks/useVerifyOTP';
import { useResendOTP } from '../../../hooks/authenticationHooks/useResendOTP';
import {
  getBlockRemainingFormattedTime,
  handleOTPKeyDown,
} from '../../../helpers/auth/otpHelper';
import { OTPContext } from '../../../constants/redux/auth/authConstants';

const CommonOTP = ({
  context,
  disabled,
  ...rest
}: {
  context: OTPContext;
  disabled?: boolean;
}) => {
  const [OTP, setOTP] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const otpRefs = useRef<HTMLInputElement[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const verifyOTP = useVerifyOTP(setOTP, setResetKey, context);

  const {
    remainingTimeToResendOTP,
    isBlockedForOTPs,
    handleResendOTP,
    blockRemainingSeconds,
  } = useResendOTP(context);

  useEffect(() => {
    if (OTP.length === 6) {
      if (/^\d{6}$/.test(OTP)) {
        setError('');
        setTimeout(() => {
          verifyOTP(OTP);
        }, 500);
      } else {
        setError('OTP must contain only numbers.');
      }
    } else if (OTP.length > 0 && OTP.length < 6) {
      setError('Otp must be of 6 digits.');
    } else {
      setError('');
    }
  }, [OTP, navigate]);


  useEffect(() => {
    if (OTP === '' && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [OTP]);

  return (
    <>
      <div className="otp_handle">
        {!isBlockedForOTPs && (
          <>
            <p className="otp_handle_title">Email Verification Code</p>
            <OTPInput
              value={OTP}
              onChange={setOTP}
              className="otp_handle_otp"
              inputClassName="otp_input"
              OTPLength={6}
              otpType="number"
              disabled={disabled}
              placeholder="------"
              autoFocus
              key={resetKey}
              {...rest}
              {...{
                renderInput: (props: any, index: number) => (
                  <input
                    {...props}
                    ref={(el) => (otpRefs.current[index] = el!)}
                    onKeyDown={(e) =>
                      handleOTPKeyDown(e, index, OTP, setOTP, otpRefs)
                    }
                  />
                ),
              }}
              onKeyDown={(e: any, index: number) =>
                handleOTPKeyDown(e, index, OTP, setOTP, otpRefs)
              }
            />
          </>
        )}
        {error && <p className="error_message">{error}</p>}
        <div className="otp_handle_resend">
          <button
            onClick={handleResendOTP}
            disabled={remainingTimeToResendOTP > 0 || isBlockedForOTPs}
            className="resend_button"
          >
            {isBlockedForOTPs
              ? `You are blocked for next ${getBlockRemainingFormattedTime(blockRemainingSeconds)}`
              : remainingTimeToResendOTP > 0
                ? `Resend OTP available in: ${remainingTimeToResendOTP} sec`
                : 'Resend OTP'}
          </button>
        </div>
      </div>
    </>
  );
};

export default CommonOTP;
