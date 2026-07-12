import Select from 'react-select';
import { Form } from 'react-bootstrap';
import './SelectField.scss';
import ErrorComponent from '../errorComponent/ErrorComponent';

const SelectField = ({
  className = '',
  menuIsOpen,
  defaultValue,
  onChange,
  options,
  name,
  isMulti,
  value,
  isClearable,
  onMenuScrollToBottom,
  placeholder,
  filterOption,
  isSearchable,
  closeMenuOnSelect,
  label,
  required,
  error,
  onBlur,
  bottomTitle,
  disabled = false,
  noOptionsMessage,
}: any) => {
  return (
    <div className="custom_select">
      {label && (
        <Form.Label htmlFor={name}>
          {label}
          {required && <sup>*</sup>}
        </Form.Label>
      )}
      <Select
        defaultValue={defaultValue}
        onChange={onChange}
        options={options}
        value={value}
        className={`select_control ${className}`}
        classNamePrefix="select"
        menuIsOpen={menuIsOpen}
        placeholder={placeholder}
        name={name}
        isMulti={isMulti}
        isClearable={isClearable}
        onMenuScrollToBottom={onMenuScrollToBottom}
        filterOption={filterOption}
        closeMenuOnSelect={closeMenuOnSelect}
        isSearchable={isSearchable}
        onBlur={onBlur}
        isDisabled={disabled}
        noOptionsMessage={noOptionsMessage}
      />
      {error && <ErrorComponent error={error} />}
      {bottomTitle && <div className="custom_select_btm_title">{bottomTitle}</div>}
    </div>
  );
};

export default SelectField;
