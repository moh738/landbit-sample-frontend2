import { Col, Row } from 'react-bootstrap';
import CommonButton from '../../../../ui/commonButton/CommonButton';
import { useModal } from '@ebay/nice-modal-react';
import { useCallback } from 'react';
import SubmitCard from './submitCard/SubmitCard';
import ExtraInfoCard from './extraInfoCard/ExtraInfoCard';
import CommonHeading from '../../../../common/commonHeading/CommonHeading';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './CompleteOnboardingDetail.scss';

const CompleteOnboardingDetail = () => {
  const navigate = useNavigate();
  const CongratulationsModal = useModal('CongratulationsModal');
  const closeCongratulationsModal = useCallback(() => {
    CongratulationsModal.remove();
  }, [CongratulationsModal]);

  const onboardingData = useSelector(
    (state: any) => state?.onboardingdata?.OnboardingData
  );

  const mainInfo = [
    {
      title: 'Institution full name',
      subTitle: onboardingData?.fullName,
    },
    {
      title: 'Date of Incorporation',
      subTitle: onboardingData?.dateIncorporation
        ? new Date(onboardingData.dateIncorporation).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '',
    },

    {
      title: 'Institutional Type',
      subTitle: onboardingData?.institutionType,
    },
    {
      title: 'Registration Number',
      subTitle: onboardingData?.regNo,
    },
    {
      title: 'Annual Turnover',
      subTitle: onboardingData?.annualTurnOver,
    },
  ];

  const addressInfo = [
    {
      title: 'Detailed Address',
      subTitle: onboardingData?.detailedAddress,
    },
    {
      title: 'Country',
      subTitle: onboardingData?.country,
    },

    {
      title: 'State',
      subTitle: onboardingData?.state,
    },
    {
      title: 'City',
      subTitle: onboardingData?.city,
    },
    {
      title: 'Postal Code',
      subTitle: onboardingData?.city,
    },
  ];


  return (
    <div className="userdetail_kyc">
      <CommonHeading heading="Complete onboarding" />
      <SubmitCard heading="Institutional Information">
        <ExtraInfoCard items={mainInfo} />
      </SubmitCard>
      <SubmitCard heading="Address Details">
        <ExtraInfoCard items={addressInfo} />
      </SubmitCard>
      <SubmitCard heading="Legal Documents">
        <Row>
        </Row>
      </SubmitCard>
      <div className="detail_btns">
        <Row>
          <Col xs={12} sm={6} lg={3} className="mt-4 mt-sm-0">
            <CommonButton
              title="Save as draft"
              className="btn-secondry"
              fluid
              onClick={() => {
                navigate(-1);
              }}
            />
          </Col>
          <Col xs={12} sm={6} lg={3} className="mt-4 mt-sm-0">
            <CommonButton
              title="Proceed"
              className="green"
              fluid
              onClick={() => {
                CongratulationsModal.show({
                  title: 'Request Submitted Successfully!',
                  description: (
                    <>
                      Your request has been successfully submitted.
                      <br />
                      It generally takes 1-2 days for approval.
                    </>
                  ),
                  btntitle: 'Done',
                  closeCongratulationsModal,
                });
              }}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default CompleteOnboardingDetail;
