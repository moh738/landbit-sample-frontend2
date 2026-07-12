import { ReactNode, useState } from 'react';
import { Form } from 'react-bootstrap';
import { CloseEyeIcon, OpenEyeIcon } from '../../../assets/icons/SvgIcon';
import ErrorComponent from '../errorComponent/ErrorComponent';
import '../FormControl.scss';
interface InputFieldProps {
  label?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  maxLength?: number;
  value?: any;
  bottomTitle?: ReactNode;
  required?: boolean;
  rightIcon?: ReactNode;
  onClick?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement, Element>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement, Element>) => void;
  restrictNumberInput?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  preventCopyPaste?: boolean;
  autoComplete?: string;
  step?: string | number;
}
const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type,
  placeholder,
  error,
  className,
  maxLength,
  value,
  bottomTitle,
  onChange,
  onBlur,
  required,
  rightIcon,
  onClick,
  disabled,
  readOnly,
  restrictNumberInput,
  preventCopyPaste,
  autoComplete = 'off',
  onFocus,
  step,
}) => {
  const [active, setActive] = useState(true);
  const handleTogglePassword = () => {
    setActive(!active);
  };
  const inputType =
    type === 'password' ? (active ? 'password' : 'text') : type || 'text';
  
  
  const getAutoCompleteValue = () => {
    if (autoComplete && autoComplete !== 'off') {
      return autoComplete;
    }
    if (type === 'password') {
      return 'new-password';
    }
    return 'off';
  };

  return (
    <div
      className={`input_group ${className} ${
        type === 'password' ? 'passfield' : ''
      }`}
    >
      {label && (
        <Form.Label htmlFor={name}>
          {label}
          {required && <sup>*</sup>}
        </Form.Label>
      )}
      <div className="input_group_inner">
        <Form.Control
          type={inputType}
          name={name}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          step={step}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          autoComplete={getAutoCompleteValue()}
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          isInvalid={!!error}
          disabled={disabled}
          readOnly={readOnly}
          onKeyDown={(e) => {
            if (restrictNumberInput && ['e', 'E', '+', '-', '.'].includes(e.key)) {
              e.preventDefault();
            }
          }}
          onCopy={(e) => {
            if (preventCopyPaste) e.preventDefault();
          }}
          onPaste={(e) => {
            if (preventCopyPaste) e.preventDefault();
          }}
          onCut={(e) => {
            if (preventCopyPaste) e.preventDefault();
          }}
        />
        {type === 'password' ? (
          <button
            type="button"
            className="input_group_passbtn"
            onClick={handleTogglePassword}
          >
            {active ? <CloseEyeIcon /> : <OpenEyeIcon />}
          </button>
        ) : (
          ''
        )}
        {rightIcon && (
          <button className="rightIcon" type="button" onClick={onClick}>
            {rightIcon}
          </button>
        )}
      </div>
      <ErrorComponent error={error} />
      {bottomTitle && <div className="input_group_btm_title">{bottomTitle}</div>}
    </div>
  );
};
export default InputField;
