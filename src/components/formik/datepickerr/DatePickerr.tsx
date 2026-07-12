import { ReactNode } from 'react';
import 'react-calendar/dist/Calendar.css';
import DateTimePicker from 'react-datetime-picker';
import 'react-datetime-picker/dist/DateTimePicker.css';
import ErrorComponent from '../errorComponent/ErrorComponent';
import { Form } from 'react-bootstrap';
import './DatePickerr.scss';

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];
const DatePickerr = (props: {
  value?: Value;
  label?: string;
  name?: string;
  calendarIcon?: ReactNode;
  sup?: boolean;
  onFocus?: () => void;
  onCalendarClose?: () => void;
  minDate?: Date;
  maxDate?: Date;
  isClockOpen?: boolean;
  isCalendarOpen?: boolean;
  className?: string;
  parentClass?: string;
  placeholder?: string;
  error?: string | boolean | undefined;
  disabled?: boolean;
  onChange?: (value: Value) => void;
  onBlur?: () => void;
}) => {
  const { placeholder, ...rest } = props;
  return (
    <>
      <div className={`common_datetime input_group ${props.parentClass}`}>
        {props.label && (
          <Form.Label htmlFor={props.name}>
            {props.label}
            {props.sup && <sup>*</sup>}
          </Form.Label>
        )}
        <div
          className={`common_datetime_wrapper ${
            props.value
              ? props.value === props.maxDate
                ? 'no-value'
                : 'has-value'
              : 'no-value'
          }  ${props.disabled ? 'isdisable' : ''}`}
        >
          {props.placeholder && (
            <span className="placeholder-text">{placeholder}</span>
          )}
          <DateTimePicker
            clearAriaLabel="Clear value"
            dayAriaLabel="Day"
            dayPlaceholder="DD"
            monthAriaLabel="Month"
            monthPlaceholder="MM"
            yearAriaLabel="year"
            yearPlaceholder="YYYY"
            nativeInputAriaLabel="Date"
            name={props.name}
            onChange={props.onChange}
            value={props.value ?? null}
            onBlur={props.onBlur}
            format="dd/MM/yyyy"
            className={`${props.className || ''} ${
              props.placeholder ? 'isplaceholder' : 'noplaceholder'
            }`}
            calendarIcon={props.calendarIcon}
            {...rest}
          />
        </div>
        {props.error && <ErrorComponent error={props.error} />}
      </div>
    </>
  );
};
export default DatePickerr;
