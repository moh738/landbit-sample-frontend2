import { useEffect, useState } from 'react';
import './ToggleSwitch.scss';
const ToggleSwitch = ({
  className,
  userLimit,
  isChecked,
  switchButton,
  setSwitchButton,
  poolEditableStatus,
  onChange,
  onClick,
  text,
}: any) => {
  const [checked, setChecked] = useState<boolean | undefined>(isChecked);
  const handleChange = () => {
    setChecked(isChecked);
    setSwitchButton && setSwitchButton(isChecked);
    onChange && onChange();
  };

  useEffect(() => {
    setChecked(isChecked);
  }, [isChecked, switchButton, poolEditableStatus, userLimit]);
  return (
    <>
      {text && <span className="tggl_switch_text ms-3">{text}</span>}
      <div className={`tggl_switch ${className}`}>
        <label className="tggl_switch_label">
          <input
            type="checkbox"
            name="name"
            checked={checked}
            onChange={() => handleChange()}
            disabled={poolEditableStatus === 'disabled' ? true : false}
            onClick={onClick}
          />
          <span className="tggl_switch_slider"></span>
        </label>
      </div>
    </>
  );
};
export default ToggleSwitch;
