import { Form, Formik } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import FormControl from '../../formik/FormControl';
import AuthCard from '../../ui/authCard/AuthCard';
import CommonButton from '../../ui/commonButton/CommonButton';
import { useDispatch } from 'react-redux';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import { landbitBackendUrl } from '../../../services/api.service';
import { ScrollToError } from '../signUp/validationSchema';
import Toast from '../../common/Toast';
import { loader } from '../../../redux/Slices/loader.slice';
import { setLoginEmail } from '../../../redux/Slices/loginProgress.slice';
import './Login.scss';
import { LoginResponse } from '../../../interfaces/responses/responses';
import { resetRedux } from '../../../helpers/cache/cacheManager';
import { useEffect } from 'react';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const initialValues = {
    email: '',
    password: '',
    check: false,
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .required('Email is required')
      .transform((value) => (value ? value?.trim() : ''))
      .max(100, 'Email must be at most 100 characters')
      .matches(
        /^(?!.*\.\.)[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/,
        'Please enter a valid email address'
      )
      .notOneOf(['support@landbitt.com'], 'This email is not allowed'),

    password: Yup.string().required('Password is required'),
  });

  const handleLogin = async (values: any) => {
    try {
      const payload = {
        email: values?.email?.trim(),
        password: values?.password,
      };
      const res: LoginResponse = await callPostMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.POST.REQUEST_LOGIN_OTP,
        data: payload,
        showToaster: true,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
        buttonKey: 'loginBtn',
      });
      if (res?.success) {
        Toast.success(res?.message);
        dispatch(setLoginEmail(values.email));
        navigate('/login/otp');
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
      className="login"
      title="Welcome Back"
      subTitle="Sign in to your account"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          handleLogin(values);
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          setFieldTouched,
          isValid,
        }) => (
          <Form onSubmit={handleSubmit} autoComplete="off">
            <FormControl
              label="Email"
              name="email"
              placeholder="Email"
              value={values.email}
              maxLength={100}
              autoComplete="off"
              onChange={(e: any) => {
                handleChange(e);
                setFieldTouched('email', true, false);
              }}
              onBlur={handleBlur}
              required
              error={touched?.email && errors?.email ? errors?.email : ''}
            />
            <FormControl
              label="Password"
              name="password"
              type="password"
              placeholder="Enter password"
              value={values.password}
              // autoComplete="new-password"
              autoComplete="off"
              maxLength={25}
              onChange={(e: any) => {
                handleChange(e);
                setFieldTouched('password', true, false);
              }}
              onBlur={handleBlur}
              required
              error={touched?.password && errors?.password ? errors?.password : ''}
              bottomTitle={
                <>
                  <Link to="/forgot-password">Forgot password?</Link>
                </>
              }
            />
            <CommonButton
              title="Sign In"
              type="submit"
              fluid
              disabled={!values?.email || !values?.password || !isValid}
            />
            <ScrollToError />
          </Form>
        )}
      </Formik>
      <p className="login_inner_no_ac">
        Don’t have an account? <Link to="/sign-up">Sign Up</Link>
      </p>
    </AuthCard>
  );
};
export default LoginPage;
