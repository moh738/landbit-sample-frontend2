import { Col, Row } from 'react-bootstrap';
import DocumentCard from '../documentCard/DocumentCard';
import './DocumentDetail.scss';
import { IMAGE_BASE_URL } from '../../../../../../utils/config';
import store from '../../../../../../redux/Store';

interface DocumentDetailProps {
  documents: {
    // Equity Disable
    esignature?: string;
    propertyValuationReport?: string;
    complianceDocument?: string;
    registrationDocuments?: string;
    titleDeed?: string;

    // Equity Enable
    companyPanCard?: string;
    equityId?: string;
    equityOfferingTerms?: string;
    incorporationCertificate?: string;
    shareholderAgreement?: string;
    valuationCertificate?: string;
    moaAndAoa?: string;
  };
  items?: { label: string; value: string }[];
}

const DocumentDetail: React.FC<DocumentDetailProps> = ({
  documents,
  items = [],
}) => {
  const equityEnable = store.getState().user.equityEnable;
  const getFullUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return IMAGE_BASE_URL + url;
  };

  const hasDocumentValue = (
    fieldName: keyof DocumentDetailProps['documents']
  ): boolean => {
    if (!documents) return false;
    const value = documents[fieldName];
    return value !== null && value !== undefined && value !== '';
  };

  const createDocumentCard = (
    title: string,
    fieldName: keyof DocumentDetailProps['documents']
  ): { title: string; url: string } | null => {
    if (!hasDocumentValue(fieldName)) return null;
    return {
      title,
      url: getFullUrl(documents?.[fieldName]),
    };
  };

  const documentCard = equityEnable
    ? [
        createDocumentCard('Incorporation Certificate', 'incorporationCertificate'),
        createDocumentCard('Company Pan Card', 'companyPanCard'),
        createDocumentCard('Shareholder Agreement', 'shareholderAgreement'),
        createDocumentCard('Valuation Certificate', 'valuationCertificate'),
        createDocumentCard('Equity Offering Terms', 'equityOfferingTerms'),
        createDocumentCard('MOA & AOA (for Pvt Ltd)', 'moaAndAoa'),
      ]?.filter((card): card is { title: string; url: string } => card !== null)
    : [
        createDocumentCard('eSignature', 'esignature'),
        createDocumentCard('Property Valuation Report', 'propertyValuationReport'),
        createDocumentCard('Compliance Document', 'complianceDocument'),
        createDocumentCard('Registration Documents', 'registrationDocuments'),
        createDocumentCard('Title Deed', 'titleDeed'),
      ]?.filter((card): card is { title: string; url: string } => card !== null);

  const dynamicDocumentCards =
    items
      ?.filter((item) => {
        const value = item?.value;
        return (
          value &&
          value !== '' &&
          value !== '-' &&
          value !== 'null' &&
          value !== 'undefined'
        );
      })
      ?.map((item) => ({
        title: item.label,
        url: getFullUrl(item.value),
      })) || [];

  const allDocuments = [...documentCard, ...dynamicDocumentCards];

  return (
    <div className="document_detail">
      <Row>
        {allDocuments?.map((item, index) => (
          <Col md={4} sm={6} key={index}>
            <DocumentCard title={item?.title} url={item?.url} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DocumentDetail;
