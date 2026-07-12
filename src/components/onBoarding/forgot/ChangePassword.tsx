import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import FormControl from '../../formik/FormControl';
import AuthCard from '../../ui/authCard/AuthCard';
import CommonButton from '../../ui/commonButton/CommonButton';
import { useNavigate } from 'react-router-dom';
import { passwordRegex, ScrollToError } from '../signUp/validationSchema';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import { landbitBackendUrl } from '../../../services/api.service';
import { useDispatch, useSelector } from 'react-redux';
import Toast from '../../common/Toast';
import { loader } from '../../../redux/Slices/loader.slice';
import { setForgotPasswordEmail } from '../../../redux/Slices/forgotPassword.slice';
import { useEffect } from 'react';
import { useAuthentication } from '../../../hooks/authenticationHooks/useAuthentication';
const ChangePassword = ({ onClickBack }: { onClick?: any; onClickBack?: any }) => {
  const initialValues = {
    newPassword: '',
    confirmPassword: '',
  };
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const forgotPasswordToken = useSelector(
    (state: RootState) => state?.forgotPasswordProgress?.forgotPasswordToken
  );

  const { forgotPasswordEmail } = useSelector(
    (state: RootState) => state?.forgotPasswordProgress
  );

  const { handleLogout } = useAuthentication();

  useEffect(() => {
    if (!forgotPasswordEmail) {
      handleLogout();
    }
  }, [forgotPasswordEmail, navigate]);

  const validationSchema = Yup.object({
    newPassword: Yup.string()
      .required('New Password is required')
      .min(8, 'Password must be at least 8 characters')
      .max(25, 'Password must be 25 characters or less')
      .matches(
        passwordRegex,
        'Use 8–25 characters with at least one upper, one lower, one number and one special; no spaces.'
      ),
    confirmPassword: Yup.string()
      .required('Confirm Password is required')
      .oneOf([Yup.ref('newPassword')], 'Both passwords must match'),
  });

  const onSubmit = async (values: any) => {
    await handleResetPassword(values);
  };

  const handleResetPassword = async (values: any) => {
    try {
      const payload = {
        newPassword: values?.newPassword,
        confirmPassword: values?.confirmPassword,
      };
      const res = await callPostMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.POST.RESET_FORGOTTEN_PASSWORD,
        data: payload,
        showToaster: true,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
        buttonKey: 'changePasswordBtn',
        customToken: forgotPasswordToken,
        token: false,
      });
      if (res?.success) {
        Toast.success(res?.message);
        dispatch(setForgotPasswordEmail(''));
        navigate('/');
      } else {
        Toast.error(res?.message);
      }
    } catch (err: any) {
      console.error('Error login:', err);
      Toast.error(err.message || 'An error occurred during sign up.');
    } finally {
      dispatch(loader(false));
    }
  };

  return (
    <AuthCard
      className="changepass"
      title="Change Password"
      subTitle="Please choose a new password."
      onClickBack={onClickBack}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          onSubmit(values);
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isValid,
        }) => (
          <Form onSubmit={handleSubmit}>
            <FormControl
              label="New Password"
              type="password"
              name="newPassword"
              placeholder="New password"
              value={values?.newPassword}
              autoComplete="off"
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.newPassword && errors?.newPassword}
              maxLength={25}
            />
            <FormControl
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={values.confirmPassword}
              autoComplete="off"
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.confirmPassword && errors?.confirmPassword}
              maxLength={25}
            />
            <CommonButton
              title="Submit"
              type="submit"
              fluid
              disabled={!values?.newPassword || !values?.confirmPassword || !isValid}
            />
            <ScrollToError />
          </Form>
        )}
      </Formik>
    </AuthCard>
  );
};
export default ChangePassword;
