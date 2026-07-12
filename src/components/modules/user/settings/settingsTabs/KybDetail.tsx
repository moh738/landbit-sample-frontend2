import { useCallback, useEffect, useState } from 'react';
import { useKybOnboarding } from '../../../../../hooks/authenticationHooks/useKybOnboarding';
import ExtraInfoCard from '../../dashboard/completeOnboardingDetail/extraInfoCard/ExtraInfoCard';
import { useSelector } from 'react-redux';
import { NoRecordIcon, UploadEyeIcon } from '../../../../../assets/icons/SvgIcon';
import SubmitCard from '../../dashboard/completeOnboardingDetail/submitCard/SubmitCard';
import '../../../../ui/uploadDocCard/UploadDocCard.scss';
import { Col, Row } from 'react-bootstrap';
import { useModal } from '@ebay/nice-modal-react';

interface KybDetailProps {
  activeTab: string;
}

const DOC_TYPES = {
  INCORP_CERT: 'incorporationCertUrl',
  GST_CERT: 'gstCertUrl',
  ADDRESS_PROOF: 'addressProofUrl',
  SIGNATORY_ID: 'signatoryIdUrl',
};

const DOCUMENT_CONFIG = [
  {
    label: 'Incorporation Certificate',
    docType: DOC_TYPES.INCORP_CERT,
    urlKey: 'incorporationCertUrlPreview',
  },
  {
    label: 'GST Certificate',
    docType: DOC_TYPES.GST_CERT,
    urlKey: 'gstCertUrlPreview',
  },
  {
    label: 'Proof of Address of Company',
    docType: DOC_TYPES.ADDRESS_PROOF,
    urlKey: 'addressProofUrlPreview',
  },
  {
    label: 'Authorized Signatory’s ID Proof',
    docType: DOC_TYPES.SIGNATORY_ID,
    urlKey: 'signatoryIdUrlPreview',
  },
];

const KybDetail: React.FC<KybDetailProps> = ({ activeTab }) => {
  const [kybData, setKybData] = useState<any>(null);
  const { fetchOnboardingData } = useKybOnboarding();
  const { email, fullName, phoneNo, accountType } = useSelector(
    (state: RootState) => state?.user?.profile
  );

  useEffect(() => {
    if (activeTab === 'Kybdetail') {
      (async () => {
        try {
          const res = await fetchOnboardingData();
          setKybData(res?.data || null);
        } catch (error) {
          console.error('Error fetching KYB data:', error);
        }
      })();
    }
  }, [activeTab, fetchOnboardingData]);

  
  const mainInfo = [
    ...(accountType === 'Institutional'
      ? [
          {
            title: 'Institution Name',
            subTitle: kybData?.fullName || fullName || '',
            expandable: true,
            truncateLength: 30,
          },
        ]
      : []),

    { title: 'Email', subTitle: email || '-' },
    { title: 'Country', subTitle: kybData?.country || '-' },
    { title: 'State', subTitle: kybData?.state || '-' },
    { title: 'City', subTitle: kybData?.city || '-' },
    { title: 'Annual Turnover', subTitle: kybData?.annualTurnover || '-' },
    { title: 'Incorporation Date', subTitle: kybData?.incorporationDate || '-' },
    { title: 'Phone Number', subTitle: kybData?.phoneNo || phoneNo || '-' },
    { title: 'Institution Type', subTitle: kybData?.institutionType || '-' },
    { title: 'Postal Code', subTitle: kybData?.postalCode || '-' },
    { title: 'Regt No', subTitle: kybData?.regtNo || '-' },
    { title: 'Detailed Address', subTitle: kybData?.address || '-' },
  ];

  const ViewModal = useModal('ViewModal');
  const closeViewModal = useCallback(() => {
    ViewModal.remove();
  }, [ViewModal]);

  const renderDocument = (doc: (typeof DOCUMENT_CONFIG)[0]) => {
    const url = kybData?.[doc.urlKey];
    if (!url) return null;

    const cleanUrl = url.split('?')[0].toLowerCase();
    const pdf = cleanUrl.endsWith('.pdf');
    const image =
      cleanUrl?.endsWith('.jpg') ||
      cleanUrl?.endsWith('.jpeg') ||
      cleanUrl?.endsWith('.png') ||
      cleanUrl?.endsWith('.webp');

    return (
      <div className="docCard">
        <label className="form-label">{doc.label}</label>
        <div className="docCard_upload">
          <div className="docCard_upload_inner">
            <div className="upload_icon">
              {(pdf || image) && (
                <div className="preview-box">
                  {pdf ? (
                    <div className="pdf-preview">
                      <embed
                        src={url}
                        type="application/pdf"
                        width="100%"
                        height="150px"
                        style={{
                          overflow: 'hidden',
                          borderRadius: '3.2rem',
                          height: '100%',
                        }}
                      />
                    </div>
                  ) : (
                    <img src={url} alt={doc.label} />
                  )}
                </div>
              )}
            </div>
            {/* 👁 Eye Icon Overlay */}
            {(pdf || image) && (
              <div
                className="eye_icon"
                onClick={() => {
                  if (pdf) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  } else {
                    ViewModal.show({
                      closeViewModal,
                      imageUrl: url,
                    });
                  }
                }}
              >
                <UploadEyeIcon />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <SubmitCard>
        <ExtraInfoCard items={mainInfo} />
      </SubmitCard>
      <SubmitCard heading="Uploaded Documents">
        <Row>
          {DOCUMENT_CONFIG.filter((doc) => kybData?.[doc.urlKey]).length === 0 ? (
            <Col>
              <div className="settings_empty_state">
                <NoRecordIcon />
                <p>No Data Found</p>
              </div>
            </Col>
          ) : (
            DOCUMENT_CONFIG.filter((doc) => kybData?.[doc.urlKey]).map((doc) => (
              <Col xl={3} md={4} sm={6} className="mb-4 mb-sm-0" key={doc.docType}>
                {renderDocument(doc)}
              </Col>
            ))
          )}
        </Row>
      </SubmitCard>
    </div>
  );
};

export default KybDetail;
