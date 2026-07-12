import NiceModal, { useModal } from '@ebay/nice-modal-react';
import CommonButton from '../../ui/commonButton/CommonButton';
import CommonModal from '../CommonModal';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { Col, Row } from 'react-bootstrap';
import FormControl from '../../formik/FormControl';
import { useCallback, useState } from 'react';
import { SearchIcon } from '../../../assets/icons/SvgIcon';
import './PropertyAdvisorSupport.scss';

const PropertyAdvisorSupport = NiceModal.create(
  ({ closePropertyAdvisorSupport }: { closePropertyAdvisorSupport: () => void }) => {
    const [activeType, setActiveType] = useState('Buy');
    const initialValues = {
      location: '',
      budget: '',
      message: '',
    };
    const validationSchema = Yup.object({
      location: Yup.string().required('REQUIRED'),
      budget: Yup.string().required('REQUIRED'),
      message: Yup.string().required('REQUIRED'),
    });
    const onSubmit = (values: any) => {
      console.log('Form values submitted:', values);
    };

    const CongratulationsModal = useModal('CongratulationsModal');
    const closeCongratulationsModal = useCallback(() => {
      CongratulationsModal.remove();
    }, [CongratulationsModal]);

    return (
      <CommonModal
        className="propertyAdvisorSupport"
        show
        onHide={closePropertyAdvisorSupport}
      >
        <h4>Property Advisor Support</h4>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            onSubmit(values);
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col xs={12}>
                  <FormControl
                    label="Location"
                    name="location"
                    type="text"
                    placeholder="Search Location"
                    value={values.location}
                    maxLength={20}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rightIcon={<SearchIcon />}
                    error={touched.location && errors.location}
                  />
                </Col>
                <Col xs={12}>
                  <FormControl
                    label="Budget"
                    name="budget"
                    type="number"
                    placeholder="Set your budget"
                    value={values.budget}
                    maxLength={20}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rightIcon="MAX"
                    error={touched.budget && errors.budget}
                  />
                </Col>
                <Col xs={12}>
                  <div className="transaction_type">
                    <label className="label">Transaction Type</label>
                    <div className="transaction_type_btns">
                      <button
                        type="button"
                        className={activeType === 'Buy' ? 'active' : ''}
                        onClick={() => setActiveType('Buy')}
                      >
                        Buy
                      </button>
                      <button
                        type="button"
                        className={activeType === 'Sell' ? 'active' : ''}
                        onClick={() => setActiveType('Sell')}
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                </Col>
                <Col xs={12} className="mb-4">
                  <FormControl
                    label="Comments"
                    control="textarea"
                    rows={3}
                    name="message"
                    placeholder="Enter your thought"
                    error={touched.message && errors.message}
                  />
                </Col>
                <Col xs={12} sm={6} className="mb-4 mb-sm-0">
                  <CommonButton
                    title="Continue"
                    fluid
                    onClick={() => {
                      CongratulationsModal.show({
                        title: 'Congratulations!',
                        description: 'Your request has been successfully sent.',
                        btntitle: 'Done',
                        closeCongratulationsModal,
                      });
                      closePropertyAdvisorSupport();
                    }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <CommonButton
                    title={'Cancel'}
                    onClick={() => {
                      closePropertyAdvisorSupport();
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
    );
  }
);
export default PropertyAdvisorSupport;
