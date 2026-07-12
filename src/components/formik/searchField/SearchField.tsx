import { Form } from 'react-bootstrap';
import ErrorComponent from '../errorComponent/ErrorComponent';
import { SearchIcon } from '../../../assets/icons/SvgIcon';
import '../FormControl.scss';

const SearchField = ({
  label,
  placeholder,
  name,
  className,
  value,
  error,
  onChange,
}: {
  label?: string;
  placeholder?: string;
  name?: string;
  className?: string;
  inputType?: any;
  value?: any;
  error?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <>
      <div className={`input_group ${className}`}>
        {label && <Form.Label htmlFor={name}>{label}</Form.Label>}
        <div className="input_group_inner searchbar">
          <Form.Control
            type="search"
            name={name}
            placeholder={placeholder}
            value={value}
            isInvalid={!!error}
            onChange={onChange}
          />
          <span className="searchIcon">
            <SearchIcon />
          </span>
        </div>
        <ErrorComponent error={error} />
      </div>
    </>
  );
};

export default SearchField;
