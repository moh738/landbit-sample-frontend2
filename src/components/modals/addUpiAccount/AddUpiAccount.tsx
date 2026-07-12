import NiceModal, { useModal } from '@ebay/nice-modal-react';
import CommonButton from '../../ui/commonButton/CommonButton';
import CommonModal from '../CommonModal';
import { useCallback, useEffect, useState } from 'react';
import { Form, Formik } from 'formik';
import { Col, Row } from 'react-bootstrap';
import FormControl from '../../formik/FormControl';
import './AddUpiAccount.scss';
import * as Yup from 'yup';
import Toast from '../../common/Toast';
import { landbitBackendUrl } from '../../../services/api.service';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import { useDispatch, useSelector } from 'react-redux';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { loader } from '../../../redux/Slices/loader.slice';
import { useBankDetails } from '../../../hooks/useBankDetail';
import { AddUpiProps } from '../../../interfaces/bankDetail/bankDetail';
import { socketService } from '../../../services/socket.service';
import { BANK_STATUS_SOCKET } from '../../../constants/sockets/socketNames';
import store from '../../../redux/Store';

const AddUpiAccount = NiceModal.create(
  ({ closeAddUpiAccount, onSuccess }: AddUpiProps) => {
    const [bankUpiDetailFetch, setBankUpiDetailFetch] = useState<any>({});
    const { fullName } = useSelector((state: RootState) => state?.user?.profile);
    const { fetchBankingDetails } = useBankDetails();
    const dispatch = useDispatch();
    const CongratulationsModal = useModal('CongratulationsModal');
    const closeCongratulationsModal = useCallback(() => {
      CongratulationsModal.remove();
    }, [CongratulationsModal]);


    const initialValues = {
      name: fullName || '',
      upiId: bankUpiDetailFetch?.upiId || '',
    };
    
    const validationSchema = Yup.object().shape({
      name: Yup.string(),
        // .required('Full name is required')
        // .trim()
        // .matches(
        //   /^[A-Za-z0-9]{2,}(?: [A-Za-z0-9]+)*$/,
        //   'Enter your Full name (2–100 characters) with single spaces only.'
        // ),

      upiId: Yup.string()
        .required('Upi id is required')
        .min(3, 'Upi id must be at least 3 characters')
        .max(50, 'Upi id cannot exceed 50 characters')
        .matches(
          /^[a-zA-Z0-9.\-_]{2,190}@[a-zA-Z]{2,64}$/,
          'Enter a valid UPI ID (minimum 3 characters before @)'
        ),
    });


    const loadBankDetails = useCallback(async () => {
      try {
        const res = await fetchBankingDetails(true);
        if (res?.success && res?.data?.approvedWallet) {
          setBankUpiDetailFetch(res?.data?.approvedWallet);
        }
      } catch (error) {
        console.error('Error preloading bank details:', error);
      }
    }, [fetchBankingDetails]);

    useEffect(() => {
      loadBankDetails();
    }, [loadBankDetails]);




    const onSubmit = async (
      values: any,
      { resetForm }: { resetForm: () => void }
    ) => {
      try {
        const payload = {
          holderName: values?.name,
          upiId: values?.upiId,
        };

        const res = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.CREATE_WALLET,
          data: payload,
          showToaster: false,
          dispatch,
          showLoader: true,
          showButtonLoader: false,
          buttonKey: 'bankAccbn',
          token: true,
        });

        if (res?.success) {
          if (onSuccess) await onSuccess();

          resetForm();
          closeAddUpiAccount();
          
          const userId = store.getState().user.profile.userId;
          if (userId && socketService?.isConnected()) {
            socketService?.emit(BANK_STATUS_SOCKET, { userId });
          }
          
          CongratulationsModal.show({
            description: (
              <>
                Your UPI details have been submitted successfully. Your request will be reviewed and approved within 3 to 5 working days. Thank you for your patience.
                <br />
              </>
            ),
            btntitle: 'Done',
            closeCongratulationsModal,
          });
        } else {
          Toast.error(res?.message || 'Failed to add bank account.');
        }
      } catch (err: any) {
        console.error('Error adding bank account:', err);
        Toast.error(err.message || 'An error occurred during sign up.');
      } finally {
        dispatch(loader(false));
      }
    };

    return (
      <CommonModal
        className="addUpiAccount"
        heading={bankUpiDetailFetch?.upiId ? 'Edit UPI Account' : 'Add UPI Account'}
        show
        onHide={closeAddUpiAccount}
      >

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          validateOnBlur={true}
          validateOnChange={true}
          validateOnMount={false}
          enableReinitialize
          onSubmit={onSubmit}
        >
          {({
            handleSubmit,
            values,
            handleChange,
            handleBlur,
            touched,
            errors,
            dirty,
            isValid,
            setFieldTouched,
          }) => (
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col sm={12}>
                  <FormControl
                    type="text"
                    name="name"
                    label="Full Name"
                    required
                    placeholder="John Doe"
                    value={values.name}
                    autoComplete="off"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleChange(e);
                      setFieldTouched('name', true, false);
                    }}
                    disabled
                    readOnly={true}
                    maxLength={100}
                    onBlur={handleBlur}
                    error={
                      touched?.name && errors?.name
                        ? String(errors.name)
                        : ''
                    }
                  />
                </Col>
                <Col sm={12}>
                  <FormControl
                    type="text"
                    name="upiId"
                    label="UPI ID"
                    required
                    placeholder="Enter UPI ID"
                    value={values.upiId}
                    autoComplete="off"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleChange(e);
                      setFieldTouched('upiId', true, true);
                    }}
                    maxLength={50}
                    onBlur={handleBlur}
                    error={
                      (touched?.upiId ||
                        (values?.upiId?.trim()?.length ?? 0) > 0) &&
                      errors?.upiId
                        ? String(errors.upiId)
                        : ''
                    }
                  />
                </Col>
                <Col lg={6} className="mb-3 mb-lg-0">
                  <CommonButton
                    fluid
                    title="Cancel"
                    className="btn-secondry"
                    onClick={() => {
                      closeAddUpiAccount();
                    }}
                  />
                </Col>
                <Col lg={6}>
                  <CommonButton
                    title="Confirm"
                    type="submit"
                    fluid
                    disabled={!(dirty && isValid)}
                  />
                </Col>
              </Row>
            </Form>
          )}
        </Formik>
      </CommonModal>
    );
  }
);
export default AddUpiAccount;
