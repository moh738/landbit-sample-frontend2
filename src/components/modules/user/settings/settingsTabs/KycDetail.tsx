import { useCallback, useEffect, useMemo, useState } from 'react';
import { useKycOnboarding } from '../../../../../hooks/authenticationHooks/useKycOnboarding';
import ExtraInfoCard from '../../dashboard/completeOnboardingDetail/extraInfoCard/ExtraInfoCard';
import { NoRecordIcon, UploadEyeIcon } from '../../../../../assets/icons/SvgIcon';
import SubmitCard from '../../dashboard/completeOnboardingDetail/submitCard/SubmitCard';
import '../../../../ui/uploadDocCard/UploadDocCard.scss';
import { Col, Row } from 'react-bootstrap';
import { useModal } from '@ebay/nice-modal-react';
import {
  getNormalizedOcrValue,
  normalizeDomesticOcr,
} from '../../../../../utils/kyc/domesticOcrNormalize';
import { formatKycDateDisplay } from '../../../../../utils/kyc/formatKycDateDisplay';

interface KycDetailProps {
  activeTab: string;
}

const KycDetail: React.FC<KycDetailProps> = ({ activeTab }) => {
  const [kycData, setKycData] = useState<any>(null);
  const { fetchOnboardingData } = useKycOnboarding();
  const ViewModal = useModal('ViewModal');

  const closeViewModal = useCallback(() => {
    ViewModal.remove();
  }, [ViewModal]);

  useEffect(() => {
    if (activeTab === 'Kycdetail') {
      (async () => {
        try {
          const res = await fetchOnboardingData();
          setKycData(res?.data || null);
        } catch (error) {
          console.error('Error fetching KYC data:', error);
        }
      })();
    }
  }, [activeTab, fetchOnboardingData]);

  const ocrNormalized = useMemo(() => normalizeDomesticOcr(kycData), [kycData]);

  const ocrExtractItems = (() => {
    const n = ocrNormalized;
    const rows: { title: string; subTitle: string }[] = [
      { title: 'Name (from document)', subTitle: getNormalizedOcrValue(n, 'name', 'fullName') },
      {
        title: 'Date of birth',
        subTitle: formatKycDateDisplay(getNormalizedOcrValue(n, 'dob', 'dateOfBirth')),
      },
      {
        title: 'Document number',
        subTitle: getNormalizedOcrValue(
          n,
          'documentNumber',
          'documentNo',
          'idNumber',
          'dlNo',
          'voterId',
          'passportNo'
        ),
      },
      { title: 'Address', subTitle: getNormalizedOcrValue(n, 'address') },
      { title: 'PIN code', subTitle: getNormalizedOcrValue(n, 'pin') },
      { title: 'Relation / father name', subTitle: getNormalizedOcrValue(n, 'relationName') },
      {
        title: 'Date of issue',
        subTitle: formatKycDateDisplay(getNormalizedOcrValue(n, 'doi')),
      },
      {
        title: 'Valid until',
        subTitle: formatKycDateDisplay(getNormalizedOcrValue(n, 'doe')),
      },
    ];
    return rows.filter(
      (item) =>
        typeof item.subTitle === 'string' &&
        item.subTitle.trim() !== '' &&
        item.subTitle !== '-'
    );
  })();

  // Support both manual KYC (fullName, email, phoneNo, address, country, state, city, postalCode)
  // and Sumsub KYC (firstName, idDocType, idDocValidUntil, idDocNumber, dob)
  const fullNameRaw = kycData?.fullName ?? kycData?.firstName ?? '';
  const mainInfo = [
    {
      title: 'Full Name',
      subTitle: fullNameRaw,
      expandable: true,
      truncateLength: 30,
    },
    { title: 'Email ID', subTitle: kycData?.email },
    { title: 'Mobile Number', subTitle: kycData?.phoneNo },
    { title: 'Country', subTitle: kycData?.country },
    { title: 'Document Type', subTitle: kycData?.documentType ?? kycData?.idDocType },
    {
      title: 'Document Valid Until',
      subTitle: formatKycDateDisplay(kycData?.idDocValidUntil),
    },
    { title: 'Document Number', subTitle: kycData?.idDocNumber },
    { title: 'Date of Birth', subTitle: formatKycDateDisplay(kycData?.dob) },
  ]?.filter(
    (item) =>
      item?.subTitle !== undefined &&
      item?.subTitle !== null &&
      item?.subTitle !== '' &&
      item?.subTitle !== '-'
  );

  const addressInfo = (() => {
    // Protean / Sumsub-style object `{ formattedAddress, postCode }` — run before flat fields so we never show JSON
    if (
      kycData?.address &&
      typeof kycData.address === 'object' &&
      !Array.isArray(kycData.address) &&
      Object.keys(kycData.address).length > 0
    ) {
      const addr = kycData.address as Record<string, unknown>;
      const formatted =
        (typeof addr.formattedAddress === 'string' && addr.formattedAddress.trim()) ||
        (typeof addr.address === 'string' && addr.address.trim()) ||
        '';
      const postal =
        (typeof addr.postCode === 'string' && addr.postCode.trim()) ||
        (typeof addr.postalCode === 'string' && addr.postalCode.trim()) ||
        (typeof addr.postCode === 'number' ? String(addr.postCode) : '') ||
        '';
      const state = typeof addr.state === 'string' ? addr.state.trim() : '';
      const city = typeof addr.city === 'string' ? addr.city.trim() : '';
      const country = typeof addr.country === 'string' ? addr.country.trim() : '';

      const rows: { title: string; subTitle: string }[] = [];
      if (formatted) {
        rows.push({ title: 'Residential Address', subTitle: formatted });
      }
      if (postal) {
        rows.push({ title: 'Postal Code', subTitle: postal });
      }
      if (city) {
        rows.push({ title: 'City', subTitle: city });
      }
      if (state) {
        rows.push({ title: 'State', subTitle: state });
      }
      if (country) {
        rows.push({ title: 'Country', subTitle: country });
      }

      if (rows.length > 0) {
        return rows.filter(
          (item) =>
            item?.subTitle !== undefined &&
            item?.subTitle !== null &&
            item?.subTitle !== ''
        );
      }
    }

    // Manual KYC: residentialAddress / string address, country, state, city, postalCode (GET user/kyc/details)
    const residentialLine =
      (typeof kycData?.residentialAddress === 'string' && kycData.residentialAddress.trim()) ||
      (typeof kycData?.address === 'string' && kycData.address.trim()) ||
      '';
    if (residentialLine || kycData?.state || kycData?.city || kycData?.postalCode) {
      return [
        { title: 'Residential Address', subTitle: residentialLine },
        { title: 'Country', subTitle: kycData?.country },
        { title: 'State', subTitle: kycData?.state },
        { title: 'City', subTitle: kycData?.city },
        { title: 'Postal Code', subTitle: kycData?.postalCode },
      ].filter(
        (item) =>
          item?.subTitle !== undefined &&
          item?.subTitle !== null &&
          item?.subTitle !== ''
      );
    }

    return [];
  })();


  const buildImageSrc = (img: any): string => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    if (img?.url || img?.imageUrl) return img?.url || img?.imageUrl;

    const base64 = img?.base64 || img?.imageBase64 || img?.base64Image;
    if (!base64) return '';

    const contentType =
      img?.contentType || img?.mimeType || img?.fileType || 'image/jpeg';

    return `data:${contentType};base64,${base64}`;
  };


  // Manual KYC documents (PDF preview URLs) or Sumsub inspection images
  const manualKycDocConfig = [
    {
      label: 'Aadhaar Card',
      urlKey: 'aadhaarCardUrlPreview' as const,
      fallback: 'aadhaarCardUrl',
    },
    {
      label: 'Voter ID',
      urlKey: 'voterIdUrlPreview' as const,
      fallback: 'voterIdUrl',
    },
    {
      label: 'Passport',
      urlKey: 'passportUrlPreview' as const,
      fallback: 'passportUrl',
    },
    {
      label: 'Driving License',
      urlKey: 'drivingLicenseUrlPreview' as const,
      fallback: 'drivingLicenseUrl',
    },
    {
      label: 'Govt ID Card',
      urlKey: 'idCardUrlPreview' as const,
      fallback: 'idCardUrl',
    },
  ];

  const inspectionImages: string[] = (() => {
    if (!kycData) return [];

    // Manual KYC: single doc (documentType + documentUrl) from GET user/kyc/details
    if (kycData.documentUrl) {
      return [kycData.documentUrlPreview || kycData.documentUrl];
    }
    // Domestic / Protean: storage paths + SAS preview URLs (front/back)
    const proteanFront =
      kycData.documentFrontPreviewUrl || kycData.documentUrlPreview;
    const proteanBack =
      kycData.documentBackPreviewUrl || kycData.documentBackUrlPreview;
    if (proteanFront || proteanBack) {
      return [proteanFront, proteanBack].filter(Boolean);
    }
    // Manual KYC: multiple doc URLs (aadhaarCardUrl, etc.)
    const manualUrls = manualKycDocConfig
      .map((d) => kycData[d.urlKey] || kycData[d.fallback])
      .filter(Boolean);
    if (manualUrls.length > 0) return manualUrls;

    const source = kycData.inspectionImages || kycData.images;
    if (Array.isArray(source)) {
      return source.map(buildImageSrc).filter(Boolean);
    }

    return [
      kycData.image1Url,
      kycData.image2Url,
      kycData.image3Url,
      kycData.idImageUrl,
      kycData.selfieImageUrl,
      kycData.documentImageUrl,
    ]?.filter(Boolean);
  })();
  const renderImage = (imageUrl: string, index: number) => {
    const cleanUrl = imageUrl?.split('?')[0].toLowerCase();
    const isPdf = cleanUrl?.endsWith('.pdf');
    const isImage =
      imageUrl?.startsWith('data:image') ||
      cleanUrl?.endsWith('.jpg') ||
      cleanUrl?.endsWith('.jpeg') ||
      cleanUrl?.endsWith('.png') ||
      cleanUrl?.endsWith('.webp');

    if (!isPdf && !isImage) return null;

    return (
      <div className="docCard" key={index}>
        <div className="docCard_upload">
          <div className="docCard_upload_inner">
            <div className="upload_icon">
              <div className="preview-box custom-preview">
                {isPdf ? (
                  <div className="pdf-preview pdf-preview-settings">
                    <iframe
                      src={imageUrl}
                      title="Document preview"
                      className="pdf-iframe"
                    />
                    <div className="pdf-preview-fallback">
                      <span className="pdf-preview-fallback-label">PDF document</span>
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pdf-preview-fallback-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                ) : (
                  <img
                    src={imageUrl}
                    alt={`Inspection Image ${index + 1}`}
                    className="inspection-img"
                  />
                )}
              </div>
            </div>

            <div
              className="eye_icon"
              onClick={() => {
                if (isPdf) {
                  window.open(imageUrl, '_blank', 'noopener,noreferrer');
                } else {
                  ViewModal.show({
                    closeViewModal,
                    imageUrl,
                  });
                }
              }}
            >
              <UploadEyeIcon />
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div>
      {mainInfo?.length > 0 && (
        <SubmitCard heading="Personal Details">
          <ExtraInfoCard items={mainInfo} />
        </SubmitCard>
      )}

      {addressInfo?.length > 0 && (
        <SubmitCard heading="Address Details">
          <ExtraInfoCard items={addressInfo} />
        </SubmitCard>
      )}

      {ocrExtractItems.length > 0 && (
        <SubmitCard heading="Extracted from document (OCR)">
          <ExtraInfoCard items={ocrExtractItems} />
        </SubmitCard>
      )}

      <SubmitCard
        heading="Legal Documents"
      >
        {(kycData?.documentType ?? kycData?.idDocType) && inspectionImages?.length > 0 && (
          <div className="mb-3">
            <span className="form-label text-muted">Document Type</span>
            <p className="mb-0 fw-medium">{kycData?.documentType ?? kycData?.idDocType}</p>
          </div>
        )}
        <Row>
          {inspectionImages?.length === 0 ? (
            <Col>
              <div className="settings_empty_state">
                <NoRecordIcon />
                <p>No Data Found</p>
              </div>
            </Col>
          ) : (
            inspectionImages?.map((img, index) => (
              <Col xl={4} md={6} sm={12} className="mb-4" key={index}>
                {renderImage(img, index)}
              </Col>
            ))
          )}
        </Row>
      </SubmitCard>
    </div>
  );
};

export default KycDetail;
