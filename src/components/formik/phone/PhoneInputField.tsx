import ReactPhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Form } from 'react-bootstrap';
import ErrorComponent from '../errorComponent/ErrorComponent';
import './PhoneInputField.scss';

interface PhoneInputFieldProps {
  label?: string;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  error?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  country?: string;
  required?: boolean;
  inputStyle?: React.CSSProperties;
  autoComplete?: string;
}

const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  className,
  disabled = false,
  country,
  inputStyle,
  required,
  autoComplete = 'off',
}) => {
  return (
    <div className={`input_group phone ${className}`}>
      {label && (
        <Form.Label htmlFor={name}>
          {label}
          {required && <sup>*</sup>}
        </Form.Label>
      )}
      <div className="input_group_inner">
        <ReactPhoneInput
          country={country}
          value={value}
          onChange={onChange}
          onBlur={() => {
            if (onBlur) {
              const phoneEvent = {
                target: {
                  name,
                  value,
                },
              } as unknown as React.FocusEvent<HTMLInputElement>;
              onBlur(phoneEvent);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          inputStyle={{ ...inputStyle, width: '100%' }} 
          enableSearch={true}
          disableDropdown={false}
          countryCodeEditable={false}
          inputProps={{
            autoComplete: autoComplete,
            'data-form-type': 'other',
          }}
        />
      </div>
      <ErrorComponent error={error} />
    </div>
  );
};

export default PhoneInputField;
