import { Form } from 'react-bootstrap';
import ErrorComponent from '../errorComponent/ErrorComponent';
import '../FormControl.scss';

interface TextareaFieldProps {
  label?: string;
  name?: string;
  rows?: number;
  placeholder?: string;
  error?: any;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement, Element>) => void;
}

const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  name,
  rows,
  placeholder,
  error,
  className,
  value,
  onChange,
  onBlur,
}) => {
  return (
    <div className={`input_group ${className}`}>
      <Form.Label htmlFor={name}>{label}</Form.Label>
      <Form.Control
        as="textarea"
        name={name}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        isInvalid={!!error}
      />
      <ErrorComponent error={error} />
    </div>
  );
};

export default TextareaField;
