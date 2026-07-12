import { Form, Formik } from 'formik';
import CommonModal from '../CommonModal';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import FormControl from '../../formik/FormControl';
import { Col, Row } from 'react-bootstrap';
import CommonButton from '../../ui/commonButton/CommonButton';
import * as Yup from 'yup';
import { useCallback } from 'react';
import './ChangePasswordModal.scss';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../services/api.service';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import { useDispatch } from 'react-redux';
import Toast from '../../common/Toast';
import { loader } from '../../../redux/Slices/loader.slice';
import { passwordRegex } from '../../onBoarding/signUp/validationSchema';

const ChangePasswordModal = NiceModal.create(
  ({
    closeChangePasswordModal,
    navigate,
  }: {
    closeChangePasswordModal: () => void;
    navigate?: (path: string) => void;
  }) => {
    const dispatch = useDispatch();
    const CongratulationsModal = useModal('CongratulationsModal');
    const closeCongratulationsModal = useCallback(() => {
      CongratulationsModal.remove();
      closeChangePasswordModal();
      if (typeof navigate === 'function') {
        navigate('/login');
      } else {
        window.location.href = '/login';
      }
    }, [CongratulationsModal, closeChangePasswordModal, navigate]);


    const initialValues = {
      newPassword: '',
      confirmPassword: '',
    };

    const validationSchema = Yup.object({
      newPassword: Yup.string()
        .required('New password is required')
        .min(8, 'Password must be at least 8 characters')
        .max(25, 'Password must be 25 characters or less')
        .matches(
          passwordRegex,
          'Use 8–25 characters with at least one upper, one lower, one number and one special; no spaces.'
        ),
      confirmPassword: Yup.string()
        .required('Confirm password is required')
        .oneOf([Yup.ref('newPassword')], 'Both passwords must match'),
    });

    const handleUpdateExistingPassword = async (values: any) => {
      try {
        const payload = {
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        };
        const res = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.UPDATE_EXISTING_PASSWORD,
          data: payload,
          showToaster: true,
          dispatch,
          showLoader: true,
          showButtonLoader: false,
          buttonKey: 'changePasswordBtn',
          token: true,
        });
        if (res?.success) {
          Toast.success(res?.message);
          closeChangePasswordModal();
          CongratulationsModal.show({
            title: 'Congratulations!',
            description: 'Your password has been changed successfully. Please log in with your new password.',
            btntitle: 'Done',
            closeCongratulationsModal,
          });
        } else {
          Toast.error(res?.message);
        }
      } catch (err: any) {
        console.error('Error changing password:', err);
        Toast.error(err.message || 'An error occurred during password change.');
      } finally {
        dispatch(loader(false));
      }
    };

    return (
      <>
        <CommonModal
          className="changePasswordModal"
          show
          onHide={closeChangePasswordModal}
        >
          <h4>Change Password</h4>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleUpdateExistingPassword}
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
                <Row>
                  <Col xs={12} sm={6}>
                    <FormControl
                      label="New Password"
                      name="newPassword"
                      type="password"
                      placeholder="****************"
                      value={values.newPassword}
                      autoComplete="off"
                      required
                      maxLength={25}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.newPassword && errors.newPassword}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <FormControl
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      placeholder="****************"
                      value={values.confirmPassword}
                      autoComplete="off"
                      required
                      maxLength={25}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.confirmPassword && errors.confirmPassword}
                    />
                  </Col>
                  <Col xs={12} sm={6} className="mb-4 mb-sm-0">
                    <CommonButton
                      title="Confirm"
                      fluid
                      type="submit"
                      disabled={
                        !values.newPassword || !values.confirmPassword || !isValid
                      }
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <CommonButton
                      title={'Cancel'}
                      onClick={() => {
                        closeChangePasswordModal();
                      }}
                      className="btn-secondry"
                      fluid
                    />
                  </Col>
                </Row>
              </Form>
            )}
          </Formik>
        </CommonModal>
      </>
    );
  }
);

export default ChangePasswordModal;
