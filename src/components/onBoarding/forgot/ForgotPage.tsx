import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import FormControl from '../../formik/FormControl';
import AuthCard from '../../ui/authCard/AuthCard';
import CommonButton from '../../ui/commonButton/CommonButton';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../services/api.service';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import { useDispatch } from 'react-redux';
import Toast from '../../common/Toast';
import { setForgotPasswordEmail } from '../../../redux/Slices/forgotPassword.slice';
import { loader } from '../../../redux/Slices/loader.slice';
import { useNavigate } from 'react-router-dom';
import { resetRedux } from '../../../helpers/cache/cacheManager';
import { useEffect } from 'react';

const ForgotPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const initialValues = {
    email: '',
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .required('Email is required')
      .transform((value) => (value ? value.trim() : ''))
      .max(100, 'Email must be at most 100 characters')
      .matches(
        /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,3}$/,
        'Please enter a valid email address'
      )
      .notOneOf(['support@landbitt.com'], 'This email is not allowed'),
  });
  const onSubmit = (values: any) => {
    requestForgotPasswordOTP(values);
  };

  const requestForgotPasswordOTP = async (values: any) => {
    try {
      const payload = {
        email: values?.email?.trim(),
      };
      const res = await callPostMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.POST.REQUEST_FORGOT_PASSWORD_OTP,
        data: payload,
        showToaster: true,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
        buttonKey: 'loginBtn',
      });
      if (res?.success) {
        Toast.success(res?.message);
        dispatch(setForgotPasswordEmail(values.email));
        navigate('/forgot-password/otp');
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

  useEffect(() => {
    resetRedux();
  }, []);

  return (
    <AuthCard
      className="forgotpass"
      title="Forgot your password"
      subTitle="Please enter the email address you’d like your password
      information sent to."
      backTo={'/'}
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
          handleChange,
          handleBlur,
          handleSubmit,
          touched,
          isValid,
          setFieldTouched,
          dirty,
        }) => (
          <Form onSubmit={handleSubmit}>
            <FormControl
              label="Email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={values.email}
              autoComplete="off"
              onChange={(e: any) => {
                handleChange(e);
                setFieldTouched('email', true, false);
              }}
              onBlur={handleBlur}
              error={touched?.email && errors?.email ? errors?.email : ''}
              maxLength={100}
            />
            <CommonButton
              title="Continue"
              type="submit"
              fluid
              disabled={!dirty || !isValid}
            />
          </Form>
        )}
      </Formik>
    </AuthCard>
  );
};
export default ForgotPage;
