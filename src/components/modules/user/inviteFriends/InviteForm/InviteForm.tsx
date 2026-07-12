import { Col, Form, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormControl from '../../../../formik/FormControl';
import './InviteForm.scss';
import { useSelector } from 'react-redux';
import { LANDBIT_FRONTEND } from '../../../../../utils/config';
import useCopyClipboard from '../../../../../hooks/useCopyToClipboard';

const InviteForm = () => {
  const referralCode = useSelector(
    (state: RootState) => state?.user?.profile?.referralKey
  );

  const initialValues = {
    referralCode,
    signupLink: `${LANDBIT_FRONTEND}sign-up?referralCode=${referralCode}`,
  };

  const validationSchema = Yup.object({
    email: Yup.string().required('Email is required'),
    code: Yup.string().required('Referral code is required'),
  });

  const [copyToClipboard] = useCopyClipboard();

  return (
    <div className="email_data">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          values;
        }}
      >
        {({ values }) => (
          <Form>
            <Row>
              <Col xs={12} md={12} lg={7} className="pb-3 pb-lg-0">
                <FormControl
                  label="Signup Link"
                  name="signupLink"
                  value={values.signupLink}
                  className="pb-0"
                  rightIcon="Copy"
                  onClick={() => copyToClipboard(values.signupLink)}
                />
              </Col>
              <Col xs={12} md={12} lg={5}>
                <FormControl
                  label="Referral Code"
                  name="referralCode"
                  value={values.referralCode}
                  className="pb-0"
                  rightIcon="Copy"
                  onClick={() => copyToClipboard(values.referralCode)}
                />
              </Col>
            </Row>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default InviteForm;
