export function handleOTPKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  index: number,
  OTP: string,
  setOTP: (otp: string) => void,
  otpRefs: React.RefObject<HTMLInputElement[]>
) {
  if (e.key === 'Backspace') {
    if (OTP[index]) {
      const otpArr = OTP.split('');
      otpArr[index] = '';
      setOTP(otpArr.join(''));
      e.preventDefault();
      otpRefs?.current[index]?.focus();
    } else if (index > 0) {
      otpRefs?.current[index - 1]?.focus();
    }
  }
}

export function getBlockRemainingFormattedTime(blockRemainingSeconds: number) {
  const hours = Math.floor(blockRemainingSeconds / 3600);
  const minutes = Math.floor((blockRemainingSeconds % 3600) / 60);
  const seconds = blockRemainingSeconds % 60;

  if (blockRemainingSeconds < 60) {
    // less than 1 minute → only seconds
    return `${seconds}s`;
  } else if (blockRemainingSeconds < 3600) {
    // less than 1 hour → minutes + seconds
    return `${minutes}m ${seconds}s`;
  } else {
    // 1 hour or more → hours + minutes
    return `${hours}h ${minutes}m`;
  }
}
