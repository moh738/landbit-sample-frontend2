import { useState, useEffect } from 'react';
import { Form, Formik } from 'formik';
import FormControl from '../../formik/FormControl';
import { Col, Row } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import { CopyIcon2 } from '../../../assets/icons/SvgIcon';
import useCopyClipboard from '../../../hooks/useCopyToClipboard';
import { useDepositAddress } from '../../../hooks/useDepositAddress';
import Toast from '../../common/Toast';
import './WalletDepositModal.scss';
import { ENVIRONMENT } from '../../../utils/config';

interface DepositUsdcProps {
  currency?: 'USDT' | 'USDC';
}

const DepositUsdc = ({ currency = 'USDT' }: DepositUsdcProps) => {
  const [copyToClipboard] = useCopyClipboard();
  const { fetchDepositAddress } = useDepositAddress();

  const isProd = ENVIRONMENT === 'prod';
  const defaultNetwork = isProd ? 'polygon' : 'amoy';

  const [walletAddress, setWalletAddress] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>(defaultNetwork);
  const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(true);

  const initialValues = {
    network: defaultNetwork,
  };
  const onSubmit = (values: any) => {
    console.log('Form values submitted:', values);
  };

  const networktype = isProd
    ? [{ label: 'Polygon', value: 'polygon' }]
    : [{ label: 'Amoy', value: 'amoy' }];

  const handleCopyAddress = () => {
    if (walletAddress) {
      copyToClipboard(walletAddress);
    }
  };

  // const formatAddress = (address: string) => {
  //   if (!address) return '';
  //   if (address.length <= 20) return address;
  //   return `${address.slice(0, 10)}...${address.slice(-10)}`;
  // };

  useEffect(() => {
    const loadDepositAddress = async () => {
      try {
        setIsLoadingAddress(true);
        const res = await fetchDepositAddress(false);
        if (res?.success && res?.depositAddress) {
          setWalletAddress(res?.depositAddress);
        } else {
          Toast.error(res?.message || 'Failed to fetch deposit address');
        }
      } catch (error: any) {
        console.error('Error loading deposit address:', error);
        Toast.error(error?.message || 'Failed to fetch deposit address');
      } finally {
        setIsLoadingAddress(false);
      }
    };
    loadDepositAddress();
  }, [fetchDepositAddress]);

  return (
    <>
      <Formik
        initialValues={initialValues}
        onSubmit={(values) => {
          onSubmit(values);
        }}
      >
        {({ handleSubmit, setFieldValue, values }) => (
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col sm={12}>
                {networktype.length === 1 ? (
                  <div className="network-display">
                    <label className="form-label">Blockchain Network</label>
                    <div className="network-value">
                      {networktype[0].label || (isProd ? 'Polygon' : 'Amoy')}
                    </div>
                  </div>
                ) : (
                  <FormControl
                    control="select"
                    name="network"
                    label="Blockchain Network"
                    options={networktype}
                    placeholder="Select Network"
                    value={networktype.find((opt) => opt.value === values.network)}
                    onChange={(selectedOption: any) => {
                      const selectedValue = selectedOption?.value || defaultNetwork;
                      setFieldValue('network', selectedValue);
                      setSelectedNetwork(selectedValue);
                    }}
                  />
                )}
              </Col>
            </Row>
            <div className="deposit_wrap">
              <div className="qr_code">
                <p>Scan to deposit</p>
                <div className="qr_code_img">
                  {isLoadingAddress ? (
                    <div
                      style={{
                        width: '228px',
                        height: '228px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f6f6f6',
                        borderRadius: '1.4rem',
                      }}
                    >
                      <p>Loading QR code...</p>
                    </div>
                  ) : walletAddress ? (
                    <QRCodeSVG
                      value={walletAddress}
                      size={228}
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    <div
                      style={{
                        width: '228px',
                        height: '228px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f6f6f6',
                        borderRadius: '1.4rem',
                      }}
                    >
                      <p>Failed to load address</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="copyaddress">
                <p>Smart wallet address</p>
                <div className="address">
                  <span>{isLoadingAddress ? 'Loading...' : walletAddress}</span>
                  {walletAddress && (
                    <button type="button" onClick={handleCopyAddress}>
                      <CopyIcon2 />
                    </button>
                  )}
                </div>
              </div>
              <div className="imp_method">
                <h5>Important</h5>
                <ul>
                  <li>
                    Send only {currency} to{' '}
                    {selectedNetwork === 'polygon'
                      ? 'Polygon'
                      : selectedNetwork === 'amoy'
                        ? 'Amoy'
                        : 'Ethereum'}{' '}
                    address
                  </li>
                  <li>Transactions may take 10-30 minutes to reflect</li>
                </ul>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default DepositUsdc;
