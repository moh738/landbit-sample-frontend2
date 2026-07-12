import CheckboxField from './checkboxField/CheckboxField';
import FileUploadField from './fileUploadFiled/FileUploadField';
import InputField from './inputField/InputField';
import RadioField from './radioField/RadioField';
import TextareaField from './textareaField/TextareaField';
import PhoneInputField from './phone/PhoneInputField';
import SelectField from './selectField/SelectField';
import DatePickerr from './datepickerr/DatePickerr';
import './FormControl.scss';

interface FormControlProps {
  control?: string;
  error?: any;
  [key: string]: any;
}

const FormControl: React.FC<FormControlProps> = ({ control, error, ...props }) => {
  switch (control) {
    case 'date':
      return <DatePickerr {...props} error={error} />;
    case 'phone':
      return <PhoneInputField {...props} error={error} />;
    case 'textarea':
      return <TextareaField {...props} error={error} />;
    case 'checkbox':
      return <CheckboxField {...props} error={error} />;
    case 'radio':
      return <RadioField {...props} error={error} />;
    case 'select':
      return <SelectField {...props} error={error} />;
    case 'file':
      return <FileUploadField {...props} error={error} />;
    default:
      return <InputField {...props} error={error} />;
  }
};

export default FormControl;
