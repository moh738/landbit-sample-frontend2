import NiceModal from '@ebay/nice-modal-react';
import { useEffect, useRef, useState } from 'react';
import CommonModal from '../CommonModal';
import './NFTCertificateModal.scss';
import certificateImage from '../../../assets/landbit_certificate/images/certificate.png';
import logoImage from '../../../assets/landbit_certificate/images/logo.svg';
import authoritySignatures from '../../../assets/images/authoritySignatures.png';
import estateHtmlRaw from '../../../assets/landbit_certificate/Estate.html?raw';
import fractionalHtmlRaw from '../../../assets/landbit_certificate/Fractional.html?raw';
import { useSelector } from 'react-redux';
import { ENVIRONMENT } from '../../../utils/config';
import {
  capitalizeFirstLetter,
  capitalizeEachWord,
} from '../../../helpers/user/maskEmail';

const NFTCertificateModal = NiceModal.create(
  ({
    closeNFTCertificateModal,
    htmlContent,
    item,
  }: {
    closeNFTCertificateModal: () => void;
    htmlContent?: string;
    item?: any;
  }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [processedHtml, setProcessedHtml] = useState<string>('');

    const { fullName } = useSelector((state: RootState) => state?.user?.profile);

    useEffect(() => {
      let htmlToUse = htmlContent;

      if (!htmlToUse) {
        htmlToUse =
          item?.type === 'Fractional Property'
            ? (fractionalHtmlRaw as string)
            : (estateHtmlRaw as string);
      }
      let processed = htmlToUse
        .replace(
          /(src=|url\()['"](?:\.\.\/\.\.\/public\/|images\/)?logo\.svg['"]\)?/g,
          `$1"${logoImage}")`
        )
        .replace(
          /(src=|url\()['"](?:\.\.\/\.\.\/public\/|images\/)?certificate\.png['"]\)?/g,
          `$1"${certificateImage}")`
        )
        .replace(
          /(src=|url\()['"](?:\.\.\/\.\.\/public\/|images\/)?authoritySignatures\.png['"]\)?/g,
          `$1"${authoritySignatures}")`
        );

      const escapeHtml = (text: string) => {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };

      const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ];
          const day = date.getDate();
          const month = months[date.getMonth()];
          const year = date.getFullYear();
          return `${day} ${month} ${year}`;
        } catch (error) {
          console.error('Error formatting date:', error);
          return dateString;
        }
      };

      const propertyName = item?.name || item?.propertyName;
      const displayName = propertyName ? capitalizeEachWord(propertyName) : '—';
      processed = processed?.replace(
        /(<p>Property\/Equity Name<\/p>\s*<h6>)[^<]*(<\/h6>)/g,
        `$1${escapeHtml(displayName)}$2`
      );

      const ownerName = fullName ? capitalizeFirstLetter(fullName) : '—';
      processed = processed?.replace(
        /(<p>Owner's Name<\/p>\s*<h6>)[^<]*(<\/h6>)/g,
        `$1${escapeHtml(ownerName)}$2`
      );

      const contractAddress = item?.contractAddress;
      const nftID = item?.nftId;

      let scanUrl = '';

      if (contractAddress && nftID !== undefined) {
        const isProd = ENVIRONMENT === 'prod';
        const finalNftId = isProd ? nftID : Number(nftID);

        scanUrl = isProd
          ? `https://polygonscan.com/token/${contractAddress}?a=${finalNftId}`
          : `https://amoy.polygonscan.com/token/${contractAddress}?a=${finalNftId}`;
      }

      if (contractAddress && scanUrl) {
        const clickableLink = `<a href="${scanUrl}" target="_blank" style="color:#0000EE; text-decoration:underline;">${escapeHtml(contractAddress)}</a>`;

        processed = processed.replace(
          /(<p>Contract Address<\/p>\s*<h6>)[^<]*(<\/h6>)/g,
          `$1${clickableLink}$2`
        );
      } else {
        processed = processed.replace(
          /(<p>Contract Address<\/p>\s*<h6>)[^<]*(<\/h6>)/g,
          '$1$2'
        );
      }

      const tokenQuantity = item?.quantity;
      if (tokenQuantity !== undefined && tokenQuantity !== null) {
        const quantityText = `${tokenQuantity} ${item?.ticker ? item.ticker : 'Token'}${tokenQuantity !== 1 ? 's' : ''}`;
        processed = processed.replace(
          /(<span>Token Quantity: <\/span>\s*<strong>)[^<]*(<\/strong>)/g,
          `$1${escapeHtml(quantityText)}$2`
        );
      } else {
        processed = processed.replace(
          /(<span>Token Quantity: <\/span>\s*<strong>)[^<]*(<\/strong>)/g,
          '$1$2'
        );
      }

      processed = processed.replace(
        /(<span>Property Details: <\/span>\s*<strong>)[^<]*(<\/strong>)/g,
        `$1${escapeHtml(item?.propertyType ?? '—')}$2`
      );

      const nftIdDisplay = item?.nftId !== undefined && item?.nftId !== null ? String(item.nftId) : '—';
      processed = processed.replace(
        /(<span>Token ID: <\/span>\s*<strong>)[^<]*(<\/strong>)/g,
        `$1${escapeHtml(nftIdDisplay)}$2`
      );

      // Creation date = minted date when available, else order/date
      const dateForIssue = item?.date;
      const issueDate = formatDate(dateForIssue);
      if (issueDate) {
        processed = processed.replace(
          /(<span>Creation Date: <\/span>\s*<strong>)[^<]*(<\/strong>)/g,
          `$1${escapeHtml(issueDate)}$2`
        );
      } else {
        processed = processed.replace(
          /(<span>Creation Date: <\/span>\s*<strong>)[^<]*(<\/strong>)/g,
          '$1$2'
        );
      }

      setProcessedHtml(processed);
    }, [htmlContent, item]);

    useEffect(() => {
      if (iframeRef.current && processedHtml) {
        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(processedHtml);
          iframeDoc.close();
        }
      }
    }, [processedHtml]);

    return (
      <CommonModal
        className="nftCertificateModal"
        show
        onHide={closeNFTCertificateModal}
      >
        <div className="certificate_wrap">
          <iframe ref={iframeRef} title="NFT Certificate" />
        </div>
      </CommonModal>
    );
  }
);

export default NFTCertificateModal;
