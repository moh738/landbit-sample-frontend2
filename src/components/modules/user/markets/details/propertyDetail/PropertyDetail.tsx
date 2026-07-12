import './PropertyDetail.scss';
import { IMAGE_BASE_URL } from '../../../../../../utils/config';

const PropertyDetail = ({ items }: { items?: any }) => {
  const isValidUrl = (string: string) => {
    if (!string) return false;
    try {
      const url = string.trim();
      // Check if it starts with http:// or https://
      if (url.startsWith('http://') || url.startsWith('https://')) {
        new URL(url);
        return true;
      }
      // If it doesn't have protocol, add https:// and check
      new URL(`https://${url}`);
      return true;
    } catch (_) {
      return false;
    }
  };

  const formatUrl = (url: string) => {
    if (!url) return url;
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const isDocumentField = (title: string) => {
    if (!title) return false;
    const titleLower = title.toLowerCase();
    return (
      titleLower.includes('doc') ||
      titleLower.includes('document') ||
      titleLower.includes('pdf')
    );
  };

  const isFileUrl = (value: string) => {
    if (!value) return false;
    const valueLower = value.toLowerCase();
    return (
      valueLower.includes('.pdf') ||
      valueLower.includes('.doc') ||
      valueLower.includes('.docx') ||
      valueLower.includes('/') ||
      valueLower.includes('customFields')
    );
  };

  const getDocumentUrl = (value: string) => {
    if (!value) return '';
    const trimmed = value.trim();
    // If it's already a full URL, return it
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    // Otherwise, construct the full URL using IMAGE_BASE_URL
    return IMAGE_BASE_URL + trimmed;
  };

  return (
    <div className="property_detail">
      <ul className="property_detail_list">
        {items?.map((item: any, index: any) => {
          const isCompanyWebsite = item?.title === 'Company Website';
          const isUrl = isCompanyWebsite && isValidUrl(item?.subTitle);
          const isDocument =
            isDocumentField(item?.title) && isFileUrl(item?.subTitle);
          const documentUrl = isDocument ? getDocumentUrl(item?.subTitle) : '';

          return (
            <li key={index}>
              <span>{item?.title}</span>
              {isUrl ? (
                <p>
                  <a
                    href={formatUrl(item?.subTitle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company_website_link"
                  >
                    {item?.subTitle}
                  </a>
                </p>
              ) : isDocument ? (
                <p>
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="document_link"
                  >
                    {item?.subTitle}
                  </a>
                </p>
              ) : (
                <p>{item?.subTitle}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PropertyDetail;
