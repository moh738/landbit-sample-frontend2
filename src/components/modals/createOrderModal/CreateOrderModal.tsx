import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Row, Col } from 'react-bootstrap';
import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './CreateOrderModal.scss';
import authoritySignatures from '../../../assets/images/authoritySignatures.png';

import CommonModal from '../CommonModal';
import CommonButton from '../../ui/commonButton/CommonButton';
import Toast from '../../common/Toast';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../services/api.service';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import { useDispatch, useSelector } from 'react-redux';
import { loader } from '../../../redux/Slices/loader.slice';
import { useUsdtPrice } from '../../../hooks/useUsdtPrice';
import {  formatWithCommas, capitalizeEachWord } from '../../../helpers/user/maskEmail';

/** jsPDF options for signed agreement – use A4 portrait so full PDF displays correctly when viewed */
const PDF_UPLOAD_SETTINGS = {
  orientation: 'p' as const,     // portrait: full page visible
  unit: 'mm' as const,
  format: 'a4' as const,       // standard A4 so full agreement shows
};

/** Reduce PDF file size: lower scale + JPEG (target well under 1 MB) */
const PDF_SIZE_SETTINGS = {
  captureScale: 1.25,   // 1–2: lower = smaller file
  imageFormat: 'JPEG' as const,
  jpegQuality: 0.78,    // 0–1: balance quality vs size
};

interface CreateOrderModalProps {
  propertyDetails: any;
  equityName?: string;
  closeCreateOrderModal: () => void;
  propertyId: string;
  quantity: string | number;
  committedCapital: string | number;
  method: string;
  setUploadedDocumentPath: (value: string) => void;
}

const CreateOrderModal = NiceModal.create(
  ({
    propertyDetails,
    equityName,
    closeCreateOrderModal,
    propertyId,
    quantity,
    committedCapital,
    method,
    setUploadedDocumentPath,
  }: CreateOrderModalProps) => {
    const dispatch = useDispatch();
    const CanvasModalInstance = useModal('CanvasModal');
    const docRef = useRef<HTMLDivElement | null>(null);
    const sigRef = useRef<SignatureCanvas | null>(null);
    const { profile } = useSelector((state: RootState) => state.user);
    const { cryptoEnable } = useSelector((state: RootState) => state?.user?.profile);
    const equityEnable = useSelector((state: RootState) => state?.user?.equityEnable);
    const { usdtPrice } = useUsdtPrice();
    const investmentAmountHeading = cryptoEnable ? 'Investment Amount (USDT)' : 'Investment Amount (INR)';
    const displayPropertyName = equityEnable
      ? (equityName ?? propertyDetails?.equityName ?? propertyDetails?.propertyName)
      : propertyDetails?.propertyName;

    const formatCommittedCapital = (): string => {
      const committedInInr = Number(committedCapital) || 0;
      
      if (method === 'USDT' && usdtPrice && usdtPrice > 0 && committedInInr > 0) {
        const capitalInUsdt = committedInInr / usdtPrice;
        // Format with commas - ensure proper comma formatting for thousands
        const num = Number(capitalInUsdt);
        if (isNaN(num)) return '0.0 USDT';
        
        // Format with up to 6 decimal places and add commas to integer part
        const formatted = num.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 6,
        });
        return `${formatted} USDT`;
      }
      return committedInInr ? `₹${formatWithCommas(committedInInr)}` : '₹0';
    };

    const generatePdf = async () => {
      if (!pdfDocRef.current) throw new Error('PDF document not found');

      const el = pdfDocRef.current;

      try {
        // ✅ Ensure fonts are loaded
        // @ts-ignore
        if (document.fonts?.ready) {
          // @ts-ignore
          await document.fonts.ready;
        }

        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 100));

        const { orientation, unit, format } = PDF_UPLOAD_SETTINGS;
        const pdf = new jsPDF(orientation, unit, format);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Get all pdf-page elements
        const pages = el.querySelectorAll('.pdf-page');

        for (let i = 0; i < pages.length; i++) {
          const pageElement = pages[i] as HTMLElement;

          const canvas = await html2canvas(pageElement, {
            scale: PDF_SIZE_SETTINGS.captureScale,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: pageElement.offsetWidth,
            height: pageElement.offsetHeight,
          });

          const imgData =
            PDF_SIZE_SETTINGS.imageFormat === 'JPEG'
              ? canvas.toDataURL('image/jpeg', PDF_SIZE_SETTINGS.jpegQuality)
              : canvas.toDataURL('image/png');

          // Scale image to fit full page so entire content is visible
          const scale = Math.min(
            pdfWidth / canvas.width,
            pdfHeight / canvas.height
          );
          const imgWidth = canvas.width * scale;
          const imgHeight = canvas.height * scale;
          const x = (pdfWidth - imgWidth) / 2;
          const y = (pdfHeight - imgHeight) / 2;

          if (i > 0) {
            pdf.addPage(format, orientation);
          }

          pdf.addImage(imgData, PDF_SIZE_SETTINGS.imageFormat, x, y, imgWidth, imgHeight);
        }

        return pdf.output('blob');
      } catch (error) {
        console.error('PDF generation error:', error);
        throw error;
      }
    };

    // const handlePreview = async () => {
    //   try {
    //     const pdfBlob = await generatePdf();
    //     const url = URL.createObjectURL(pdfBlob);

    //     // Open in new tab for preview
    //     window.open(url, '_blank');

    //     // Also trigger download
    //     const link = document.createElement('a');
    //     link.href = url;
    //     link.download = 'agreement-preview.pdf';
    //     link.click();

    //     // Clean up
    //     setTimeout(() => URL.revokeObjectURL(url), 100);

    //     Toast.success('PDF preview generated! Check your downloads.');
    //   } catch (e) {
    //     console.error(e);
    //     Toast.error('Failed to generate preview');
    //   }
    // };

    const handleSubmit = async () => {
      // if (!sigRef.current || sigRef.current.isEmpty()) {
      //   Toast.error('Please add your signature');
      //   return;
      // }

      try {

        dispatch(loader(true));

        // Generate PDF
        const pdfBlob = await generatePdf();

        const form = new FormData();
        form.append('file', pdfBlob, 'signed-certificate.pdf');
        form.append('propertyId', propertyId);
        form.append('fileType', 'orderSignature');

        const res = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.UPLOAD_MEDIA,
          data: form,
          dispatch,
          token: true,
          showLoader: true,
          showButtonLoader: false,
          buttonKey: 'uploadMedia',
        });

        if (!res?.success) {
          Toast.error(res?.message || 'Certificate failed to upload');
          return;
        }

        Toast.success('Certificate uploaded, you can now proceed');
        closeCreateOrderModal();
        setUploadedDocumentPath(res?.data);
      } catch (e) {
        console.error(e);
        Toast.error('Something went wrong');
      } finally { }
    };

    const openCanvasModal = () => {
      CanvasModalInstance.show({
        saveSignaturePreview: saveSignaturePreview,
        sigRef,
      });
    };

    const [signatureImage, setSignatureImage] = useState<string>('');
    const pdfDocRef = useRef<HTMLDivElement | null>(null);

    const saveSignaturePreview = () => {
      if (!sigRef.current || sigRef.current.isEmpty()) {
        setSignatureImage('');
        return;
      }

      const dataUrl = sigRef.current.toDataURL('image/png');
      setSignatureImage(dataUrl);
    };

    return (
      <CommonModal
        show
        onHide={closeCreateOrderModal}
        className="createOrderModal agreement_modal"
      >
        <div ref={docRef} className="agreement_document">
          <h2 className="agreement_title">USER AGREEMENT</h2>

          <p className="agreement_intro">
            This User Agreement ("Agreement") is entered into as of this date between
            the undersigned User and the Entity, setting forth the terms and
            conditions governing the User's participation and investment.
          </p>

          <div className="agreement_section">
            <h5>1. PARTIES TO THE AGREEMENT</h5>

            <p>
              <strong>User ("You" or "User"):</strong> An individual or entity
              entering into this Agreement for the purpose of investment
              participation.
            </p>

            <p>
              <strong>Entity:</strong> The issuing organization offering NFTs.
            </p>
          </div>

          <div className="agreement_section">
            <h5>2. USER IDENTIFICATION AND VERIFICATION</h5>

            <p>
              The User hereby provides the following information for identification
              and record-keeping purposes:
            </p>

            <table className="agreement_table">
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th>User Response</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>User Name</td>
                  <td>{capitalizeEachWord(profile?.fullName || '')}</td>
                </tr>
                <tr>
                  <td>Email Address</td>
                  <td>{(profile?.email || '').replace(/\s/g, '')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="agreement_section">
            <h5>3. PROPERTY/EQUITY NAME AND INVESTMENT DETAILS</h5>

            <p>
              The User agrees to invest in the Property/Equity Name and quantity as
              specified below:
            </p>

            <table className="agreement_table">
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Property/Equity Name</td>
                  <td>{displayPropertyName}</td>
                </tr>
                <tr>
                  <td>{investmentAmountHeading}</td>
                  <td>{formatCommittedCapital()}</td>
                </tr>
                <tr>
                  <td>Quantity of Units / NFTs</td>
                  <td>{quantity}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="agreement_section">
            <h5>4. TERMS AND CONDITIONS</h5>

            <p>
              <strong>1. Investment Commitment:</strong> The User acknowledges that
              the investment amount specified above is a binding commitment and shall
              be paid as per the agreed payment schedule.
            </p>

            <p>
              <strong>2. Ownership and Rights:</strong> Upon completion of payment,
              the User shall be issued the specified quantity of units/NFTs
              representing proportional ownership or beneficial interest in the
              Property/Equity, subject to the terms of this Agreement and applicable
              laws.
            </p>

            <p>
              <strong>3. Documentation:</strong> The User agrees to provide authentic
              and verifiable documentation as requested by the Entity for compliance
              and regulatory purposes.
            </p>

            <p>
              <strong>4. Representations:</strong> The User represents and warrants
              that:
            </p>

            <ul>
              <li>They have the legal capacity to enter into this Agreement</li>
              <li>All information provided is true, accurate, and complete</li>
              <li>
                They understand the nature and risks associated with the investment
              </li>
            </ul>

            <p>
              <strong>5. Governing Law:</strong> This Agreement shall be governed by
              and construed in accordance with the applicable laws of BVI.
            </p>
          </div>

          <div className="agreement_section">
            <h5>5. CONFIDENTIALITY AND DATA PROTECTION</h5>

            <p>
              The User acknowledges that all information provided shall be treated as
              confidential and shall be used solely for the purposes of this
              Agreement and regulatory compliance.
            </p>
          </div>

          <div className="agreement_section">
            <h5>6. ACKNOWLEDGMENT AND ACCEPTANCE</h5>

            <p>The User hereby acknowledges that:</p>

            <ul>
              <li>They have read and understood the terms of this Agreement</li>
              <li>
                They enter into this Agreement voluntarily and without coercion
              </li>
              <li>
                They accept all terms, conditions, and obligations outlined herein
              </li>
            </ul>
          </div>

          <div className="agreement_section">
            <h5>7. SIGNATURE SECTION</h5>

            <p>
              By executing below, the User confirms their agreement to the terms and
              conditions stated in this document.
            </p>

            <table className="agreement_table signature_table">
              <tbody>
                <tr>
                  <td>User Name (Print)</td>
                  <td>{capitalizeEachWord(profile?.fullName || '')}</td>
                </tr>
                <tr>
                  <td>User Signature</td>
                  <td className="signature_cell">
                    {signatureImage ? (
                      <img src={signatureImage} alt="User Signature" />
                    ) : (
                      ''
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="entity_note">For Entity Use Only:</p>

            <table className="agreement_table signature_table">
              <tbody>
                <tr>
                  <td>Authorized Signatory (Print)</td>
                  <td>Landbitt Global Partner</td>
                </tr>
                <tr>
                  <td>Authorized Signatory Signature</td>
                  <td>
                    <img
                      style={{ width: 'auto', height: '100px' }}
                      src={authoritySignatures}
                      alt="User Signature"
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="doc_meta">Document Date: {new Date().toDateString()}</p>

            <p className="doc_meta">
              Agreement Reference Number (if applicable): AGR-2023-0001
            </p>

            <p className="agreement_footer_text">
              This Agreement constitutes the entire understanding between the parties
              and supersedes all prior negotiations, representations, and agreements,
              whether written or oral.
            </p>
          </div>
        </div>

        {/* <Row className="mb-3">
          <Col xs={12}>
            <CommonButton
              title="Preview PDF"
              className="btn-secondry"
              fluid
              onClick={handlePreview}
            />
          </Col>
        </Row> */}

        <Row>
          <Col xs={signatureImage ? 4 : 6}>
            <CommonButton
              title="Cancel"
              className="btn-secondry"
              fluid
              onClick={closeCreateOrderModal}
            />
          </Col>
          {signatureImage && (
            <Col xs={4}>
              <CommonButton
                title="Edit Sign"
                className="btn-secondry"
                fluid
                onClick={openCanvasModal}
              />
            </Col>
          )}
          <Col xs={signatureImage ? 4 : 6}>
            <CommonButton
              title={signatureImage ? 'Submit' : 'Add Signature'}
              fluid
              // disabled={isEmpty}
              onClick={signatureImage ? handleSubmit : openCanvasModal}
            />
          </Col>
        </Row>

        {/* Hidden PDF Document - A4 size optimized for PDF generation */}
        <div ref={pdfDocRef} className="pdf-document-container">
          <div className="pdf-page">
            <h2 className="pdf-title">USER AGREEMENT</h2>

            <p className="pdf-text">
              This User Agreement ("Agreement") is entered into as of this date
              between the undersigned User and the Entity, setting forth the terms
              and conditions governing the User's participation and investment.
            </p>

            <div className="pdf-section">
              <h5 className="pdf-heading">1. PARTIES TO THE AGREEMENT</h5>
              <p className="pdf-text">
                <strong>User ("You" or "User"):</strong> An individual or entity
                entering into this Agreement for the purpose of investment
                participation.
              </p>
              <p className="pdf-text">
                <strong>Entity:</strong> The issuing organization offering NFTs.
              </p>
            </div>

            <div className="pdf-section">
              <h5 className="pdf-heading">
                2. USER IDENTIFICATION AND VERIFICATION
              </h5>
              <p className="pdf-text">
                The User hereby provides the following information for identification
                and record-keeping purposes:
              </p>

              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>Particulars</th>
                    <th>User Response</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>User Name</td>
                    <td>{capitalizeEachWord(profile?.fullName || '')}</td>
                  </tr>
                  <tr>
                    <td>Email Address</td>
                    <td>{(profile?.email || '').replace(/\s/g, '')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pdf-section">
              <h5 className="pdf-heading">
                3. PROPERTY/EQUITY AND INVESTMENT DETAILS
              </h5>
              <p className="pdf-text">
                The User agrees to invest in the PROPERTY/EQUITY and quantity as
                specified below:
              </p>
            </div>
            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Property/Equity Name</td>
                  <td>{displayPropertyName}</td>
                </tr>
                <tr>
                  <td>{investmentAmountHeading}</td>
                  <td>{formatCommittedCapital()}</td>
                </tr>
                <tr>
                  <td>Quantity of Units / NFTs</td>
                  <td>{quantity}</td>
                </tr>
              </tbody>
            </table>

            <div className="pdf-section">
              <h5 className="pdf-heading">4. TERMS AND CONDITIONS</h5>
              <p className="pdf-text">
                <strong>1. Investment Commitment:</strong> The User acknowledges that
                the investment amount specified above is a binding commitment and
                shall be paid as per the agreed payment schedule.
              </p>
              <p className="pdf-text">
                <strong>2. Ownership and Rights:</strong> Upon completion of payment,
                the User shall be issued the specified quantity of units/NFTs
                representing proportional ownership or beneficial interest in the
                Property/Equity, subject to the terms of this Agreement and applicable laws.
              </p>
              <p className="pdf-text">
                <strong>3. Documentation:</strong> The User agrees to provide
                authentic and verifiable documentation as requested by the Entity for
                compliance and regulatory purposes.
              </p>
              <p className="pdf-text">
                <strong>4. Representations:</strong> The User represents and warrants
                that:
              </p>
            </div>
          </div>

          {/* Page 2 */}
          <div className="pdf-page">
            <div className="pdf-section">
              <ul className="pdf-list">
                <li>They have the legal capacity to enter into this Agreement</li>
                <li>All information provided is true, accurate, and complete</li>
                <li>
                  They understand the nature and risks associated with the investment
                </li>
              </ul>
              <p className="pdf-text">
                <strong>5. Governing Law:</strong> This Agreement shall be governed
                by and construed in accordance with the applicable laws of BVI.
              </p>
            </div>

            <div className="pdf-section">
              <h5 className="pdf-heading">5. CONFIDENTIALITY AND DATA PROTECTION</h5>
              <p className="pdf-text">
                The User acknowledges that all information provided shall be treated
                as confidential and shall be used solely for the purposes of this
                Agreement and regulatory compliance.
              </p>
            </div>

            <div className="pdf-section">
              <h5 className="pdf-heading">6. ACKNOWLEDGMENT AND ACCEPTANCE</h5>
              <p className="pdf-text">The User hereby acknowledges that:</p>
              <ul className="pdf-list">
                <li>They have read and understood the terms of this Agreement</li>
                <li>
                  They enter into this Agreement voluntarily and without coercion
                </li>
                <li>
                  They accept all terms, conditions, and obligations outlined herein
                </li>
              </ul>
            </div>

            <div className="pdf-section">
              <h5 className="pdf-heading">7. SIGNATURE SECTION</h5>
              <p className="pdf-text">
                By executing below, the User confirms their agreement to the terms
                and conditions stated in this document.
              </p>

              <table className="pdf-table pdf-signature-table">
                <tbody>
                  <tr>
                    <td>User Name (Print)</td>
                    <td>{capitalizeEachWord(profile?.fullName || '')}</td>
                  </tr>
                  <tr>
                    <td>User Signature</td>
                    <td className="pdf-signature-cell">
                      {signatureImage && (
                        <img src={signatureImage} alt="User Signature" />
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="pdf-text pdf-entity-note">For Entity Use Only:</p>

              <table className="pdf-table pdf-signature-table">
                <tbody>
                  <tr>
                    <td>Authorized Signatory (Print)</td>
                    <td>Landbitt Global Partner</td>
                  </tr>
                  <tr>
                    <td>Authorized Signatory Signature</td>
                    <td>
                      <img
                        style={{ width: 'auto', height: '100px' }}
                        src={authoritySignatures}
                        alt="User Signature"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="pdf-meta">Document Date: {new Date().toDateString()}</p>
              <p className="pdf-meta">
                Agreement Reference Number (if applicable): AGR-2023-0001
              </p>
              <p className="pdf-footer-text">
                This Agreement constitutes the entire understanding between the
                parties and supersedes all prior negotiations, representations, and
                agreements, whether written or oral.
              </p>
            </div>
          </div>
        </div>
      </CommonModal>
    );
  }
);

export default CreateOrderModal;
