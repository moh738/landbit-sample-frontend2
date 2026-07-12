import { Form } from 'react-bootstrap';
import ErrorComponent from '../errorComponent/ErrorComponent';
import '../FormControl.scss';

interface RadioFieldProps {
  label?: string;
  name?: string;
  options?: { value: string; label: string }[];
  error?: string;
  className?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement, Element>) => void;
}

const RadioField: React.FC<RadioFieldProps> = ({
  label,
  name,
  options,
  error,
  className,
  value,
  onChange,
  disabled,
  onBlur,
}) => {
  return (
    <div className={`input_group ${className}`}>
      {label && <Form.Label>{label}</Form.Label>}
      {options?.map((option) => (
        <Form.Check
          key={option.value}
          type="radio"
          name={name}
          value={option.value}
          label={option.label}
          disabled={disabled}
          checked={value === option.value}
          onChange={onChange}
          onBlur={onBlur}
          isInvalid={!!error}
        />
      ))}
      <ErrorComponent error={error} />
    </div>
  );
};

export default RadioField;
