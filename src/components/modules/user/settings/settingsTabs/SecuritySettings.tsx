import { Col, Row } from 'react-bootstrap';
import ToggleSwitch from '../../../../ui/toggleSwitch/ToggleSwitch';
import '../Settings.scss';
import { useAuthentication } from '../../../../../hooks/authenticationHooks/useAuthentication';
import { useSelector } from 'react-redux';
import CommonHeading from '../../../../common/commonHeading/CommonHeading';

const SecuritySetting = () => {
  const { profile } = useSelector((state: RootState) => state.user);

  const fee = [
    {
      name: 'Login Notifications',
      info: 'Get notified of new logins',
      key: 'loginNotification',
    },
  ];

  const { handleLoginNotify } = useAuthentication();

  return (
    <div className="security_settings">
      <CommonHeading heading="Security Settings" />
      <Row>
        {fee.map((item, index) => (
          <Col lg={5} sm={6} key={index} className="mb-3 mb-lg-0">
            <div className="setting_form">
              <div className="form_group">
                <div className="data">
                  <h5>{item.name}</h5>
                  <h6>{item.info}</h6>
                </div>
                <ToggleSwitch
                  isChecked={profile.loginNotify}
                  onChange={() => handleLoginNotify(!profile.loginNotify)}
                />
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default SecuritySetting;
