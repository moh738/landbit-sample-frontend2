import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import ProteanKycFlow from './ProteanKycFlow';
import CompleteKycOnboardingManual from './CompleteKycOnboardingManual';

const KycOnboardingEntry = () => {
  const profile = useSelector((state: RootState) => state.user.profile);

  const isIndian = useMemo(() => {
    const rawCountry = (profile as any)?.country;
    if (!rawCountry || typeof rawCountry !== 'string') return false;
    const value = rawCountry.trim().toLowerCase();
    if (!value) return false;
    if (value === 'in' || value === 'ind' || value === 'indian') return true;
    if (value.includes('india')) return true;
    return false;
  }, [profile]);

  return isIndian ? <ProteanKycFlow /> : <CompleteKycOnboardingManual />;
};

export default KycOnboardingEntry;

