import { Form, Formik } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import FormControl from '../../formik/FormControl';
import CommonButton from '../../ui/commonButton/CommonButton';
import { useSearchParams } from 'react-router-dom';

import {
  emailField,
  nameField,
  passwordField,
  phoneField,
  ScrollToError,
  termsField,
} from './validationSchema';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../services/api.service';
import { useDispatch, useSelector } from 'react-redux';
import { INDIVIDUAL } from '../../../constants/redux/auth/authConstants';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import { setSignUpEmail } from '../../../redux/Slices/signUpProgress.slice';
import Toast from '../../common/Toast';
import { loader } from '../../../redux/Slices/loader.slice';
import { useEffect, useState } from 'react';
import { resetRedux } from '../../../helpers/cache/cacheManager';
import { Country } from 'country-state-city';

const AccountSignUp = () => {
  const dispatch = useDispatch();
  const { accountType } = useSelector((state: RootState) => state.signUpProgress);
  const [countryCode, setCountryCode] = useState('IN');
  const [countryKey, setCountryKey] = useState('IN');
  const [countryName, setCountryName] = useState('India');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCodeFromUrl = searchParams.get('referralCode');

  const countries =
    Country?.getAllCountries()?.map((country) => ({
      value: country?.isoCode,
      label: country?.name,
    })) ?? [];
  const initialValues = {
    FullName: '',
    Email: '',
    Country: 'IN',
    PhoneNumber: '',
    Password: '',
    ConfirmPassword: '',
    Check: false,
    ReferralCode: referralCodeFromUrl || '',
  };

  const validationSchema = Yup.object({
    FullName:
      accountType === INDIVIDUAL
        ? nameField.required('Full Name is required')
        : Yup.string()
            .required('Institution Name is required')
            .trim()
            .matches(
              /^[A-Za-z0-9]{2,}(?: [A-Za-z0-9]+)*$/,
              'Enter institution name (2–100 letters and numbers) with single spaces only.'
            ),
    Email: emailField,
    // Country validation removed - field is hidden during signup
    PhoneNumber: phoneField(countryCode),
    Password: passwordField,
    ConfirmPassword: Yup.string()
      .required('Confirm Password is required')
      .oneOf([Yup.ref('Password')], 'Both passwords must match.'),
    Check: termsField,
    ReferralCode: Yup.string()
      .trim()
      .transform((v) => (v || '').toUpperCase())
      .test(
        'empty-or-6-mixed',
        'Referral Code must be 6 chars with at least one letter and one number.',
        (v) => !v || /^(?=.*[A-Z])(?=.*\d)[A-Z0-9-]{6}$/.test(v)
      ),
  });

  const requestSignUpOTP = async (values: any, activeTab: string) => {
    try {
      const selectedCountry =
        Country?.getAllCountries()?.find((c) => c.isoCode === values?.Country) ??
        Country?.getAllCountries()?.find(
          (c) => c.isoCode.toUpperCase() === countryKey.toUpperCase()
        );

      const resolvedCountryName =
        selectedCountry?.name || countryName || 'India';

      const payload: any = {
        accountType: activeTab === INDIVIDUAL ? 'Individual' : 'Institutional',
        fullName: values?.FullName?.trim(),
        email: values?.Email?.trim(),
        phoneNo: values?.PhoneNumber,
        password: values?.Password,
        referralBy: values?.ReferralCode?.trim()?.toUpperCase(),
        country: resolvedCountryName,
      };

      const res = await callPostMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.POST.REQUEST_SIGN_UP_OTP,
        data: payload,
        showToaster: true,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
        buttonKey: 'signUpBtn',
      });

      if (res?.success) {
        dispatch(setSignUpEmail(values?.Email));
        navigate('/sign-up/otp');
        Toast.success(res?.message);
      } else if (!res?.status) {
        Toast.error(res?.message);
        return;
      }
    } catch (err: any) {
      console.error('Error signing up:', err);
      Toast.error(err.message || 'An error occurred during sign up.');
    } finally {
      dispatch(loader(false));
    }
  };

  useEffect(() => {
    resetRedux();
  }, []);
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        requestSignUpOTP(values, accountType);
      }}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
        dirty,
        isValid,
        resetForm,
      }) => {
        useEffect(() => {
          resetForm({
            values: {
              ...initialValues,
              PhoneNumber: '+91',
              Country: 'IN',
            },
          });
          setCountryCode('IN');
          setCountryKey('IN');
          setCountryName('India');
        }, [accountType, resetForm]);
        return (
          <Form onSubmit={handleSubmit}>
            <FormControl
              label={accountType === INDIVIDUAL ? 'Full Name' : 'Institution Name'}
              name="FullName"
              placeholder={
                accountType === INDIVIDUAL ? 'Full Name' : 'Institution Name'
              }
              value={values.FullName}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="off"
              maxLength={100}
              error={touched?.FullName && errors?.FullName}
              required
            />
            <FormControl
              label="Email"
              name="Email"
              placeholder="Email"
              value={values.Email}
              autoComplete="off"
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={100}
              required
              error={touched?.Email && errors?.Email}
            />
            {countries.length > 0 ? (
              <FormControl
                label="Country"
                control="select"
                name="Country"
                className="blockchain_sel"
                options={countries}
                value={countries.find((c) => c.value === values.Country) || null}
                onChange={(option: any) => {
                  const isoCode = option?.value || 'IN';
                  const label = option?.label || 'India';
                  setFieldValue('Country', isoCode);
                  setCountryKey(isoCode);
                  setCountryName(label);
                }}
                placeholder="Select a Country"
                required
              />
            ) : (
              <FormControl
                label="Country"
                name="Country"
                placeholder="Country"
                value={values.Country}
                autoComplete="off"
                onChange={(e: any) => {
                  const isoCode = e.target.value || '';
                  setFieldValue('Country', isoCode);
                  setCountryKey(isoCode || countryKey);
                }}
                onBlur={handleBlur}
              />
            )}
            <FormControl
              label="Phone number"
              control="phone"
              name="PhoneNumber"
              placeholder="Mobile number"
              value={values.PhoneNumber}
              autoComplete="off"
              error={touched?.PhoneNumber && errors?.PhoneNumber}
              onBlur={handleBlur}
              required
              country={'in'}
              onChange={(value: string, data: any) => {
                setFieldValue('PhoneNumber', `+${value}`);
                const isoFromPhone = data?.countryCode?.toUpperCase();
                if (isoFromPhone) {
                  setCountryCode(isoFromPhone);
                }
              }}
              disableCountryCode={true}
              disableDropdown={false}
              enableSearch={true}
              maxlength={13}
            />
            <FormControl
              label="Referral Code"
              name="ReferralCode"
              placeholder="ABC123"
              value={values.ReferralCode}
              autoComplete="off"
              onChange={(e: any) => {
                const cleaned = e.target.value
                  .replace(/[^a-z0-9-]/gi, '')
                  .toUpperCase()
                  .slice(0, 6);
                setFieldValue('ReferralCode', cleaned);
              }}
              onBlur={handleBlur}
              maxLength={6}
              error={touched?.ReferralCode && errors?.ReferralCode}
            />
            <div className="password">
              <FormControl
                label="Password"
                type="password"
                name="Password"
                placeholder="**********"
                value={values.Password}
                autoComplete="off"
                onChange={handleChange}
                onBlur={handleBlur}
                required
                maxLength={25}
                error={touched?.Password && errors?.Password}
              />
              <FormControl
                label="Confirm Password"
                type="password"
                name="ConfirmPassword"
                placeholder="**********"
                value={values.ConfirmPassword}
                autoComplete="off"
                onChange={handleChange}
                required
                onBlur={handleBlur}
                maxLength={25}
                error={touched?.ConfirmPassword && errors?.ConfirmPassword}
              />
            </div>
            <p className="signup_tc">
              <FormControl
                control="checkbox"
                name="Check"
                label={
                  <>
                    By clicking Sign Up you agree to Landbitt{' '}
                    <Link
                      to="https://landbitt.com/terms-conditions/"
                      target="_blank"
                    >
                      <u>Terms and conditions</u>
                    </Link>{' '}
                  </>
                }
                value={values.Check}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.Check && errors.Check}
              />
            </p>
            <CommonButton
              title="Sign Up"
              type="submit"
              fluid
              disabled={!dirty || !isValid}
            />
            <p className="signup_inner_ac">
              Already have an account?{' '}
              <Link to="/login" className="">
                Sign In
              </Link>
            </p>
            <ScrollToError />
          </Form>
        );
      }}
    </Formik>
  );
};
export default AccountSignUp;
