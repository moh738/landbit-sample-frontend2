import AuthCard from '../../ui/authCard/AuthCard';
import TabsComponent from '../../ui/tabsComponent/TabsComponent';
import AccountSignUP from './AccountSignUp';
import { useDispatch, useSelector } from 'react-redux';
import { setAccountType } from '../../../redux/Slices/signUpProgress.slice';
import {
  INDIVIDUAL,
  INSTITUTIONAL,
} from '../../../constants/redux/auth/authConstants';
import './SignUp.scss';

const SignUp = () => {
  const dispatch = useDispatch();

  const { accountType } = useSelector((state: RootState) => state.signUpProgress);

  const tabItems = [
    { key: INDIVIDUAL, label: 'Individual' },
    { key: INSTITUTIONAL, label: 'Institutional' },
  ];

  return (
    <AuthCard
      className="signup"
      title="Investor Sign Up"
      subTitle="Create an account to continue"
    >
      <label className="signup_title">Account Type</label>
      <TabsComponent
        activeTab={accountType}
        onSelect={(key) => dispatch(setAccountType(key ?? INDIVIDUAL))}
        tabItems={tabItems}
      />

      <div className="tab_content">
        <AccountSignUP />
      </div>
    </AuthCard>
  );
};
export default SignUp;
