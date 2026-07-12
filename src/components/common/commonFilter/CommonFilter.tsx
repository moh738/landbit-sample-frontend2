import SearchField from '../../formik/searchField/SearchField';
import CommonButton from '../../ui/commonButton/CommonButton';
import FormControl from '../../formik/FormControl';
import { Form, Formik } from 'formik';
import { CalendarIcon } from '../../../assets/icons/SvgIcon';
import './CommonFilter.scss';

interface CommonFilterProps {
  SearchField?: boolean;
  searchplaceholder?: string;
  statusfield?: { value: string; label: string }[];
  statusplacehoder?: string;
  btntitle?: any;
  onFilterChange?: (values: any) => void; //
  currencytype?: { value: string; label: string }[];
  startDate?: any;
  endDate?: any;
  initialValues?: any;
  btnClick?: () => void;
  btnDisabled?: boolean;
  defaultValue?: { value: string; label: string } | string;
  csvBtnTitle?: string;
  clearFiltersBtnTitle?: string;
  onClearFiltersClick?: () => void;
  clearFiltersBtnDisabled?: boolean;
  onCsvClick?: () => void;
  csvDisabled?: boolean;
  className?: string;
  startDateMin?: Date;
  startDateMax?: Date;
  endDateMin?: Date;
  endDateMax?: Date;
}

const CommonFilter = (props: CommonFilterProps) => {
  const initialValues = {
    search: '',
    status: props.defaultValue || (props.statusfield ? props.statusfield[0] : ''),
    country: '',
    network: '',
    startDate: null,
    endDate: null,
    ...props.initialValues,
  };

  return (
    <div className="filter">
      <Formik
        initialValues={initialValues}
        enableReinitialize
        onSubmit={(values) => {
          props?.onFilterChange?.(values);
        }}
      >
        {({
          handleSubmit,
          setFieldValue,
          values,
          errors,
          setFieldError,
          touched,
          resetForm,
        }) => (
          <Form onSubmit={handleSubmit}>
            {props.SearchField && (
              <div className="filter_left">
                <SearchField
                  className="search_input"
                  placeholder={props.searchplaceholder}
                  value={values.search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    setFieldValue('search', val);
                    props?.onFilterChange?.({
                      ...values,
                      search: val,
                    });
                  }}
                />
              </div>
            )}
            <div className={`filter_right ${props.className || ''}`}>
              {props.statusfield && (
                <div className="filter_select">
                  {props.statusfield && (
                    <FormControl
                      control="select"
                      name="status"
                      options={props.statusfield}
                      placeholder={props.statusplacehoder}
                      value={
                        values?.status ||
                        (props.statusfield ? props?.statusfield[0] : '')
                      }
                      onChange={(val: string) => {
                        setFieldValue('status', val);
                        props?.onFilterChange?.({ ...values, status: val });
                      }}
                      isSearchable={false}
                    />
                  )}
                  {props.currencytype && (
                    <FormControl
                      control="select"
                      name="currency"
                      options={props.currencytype}
                      placeholder={`${
                        props.statusplacehoder
                          ? props.statusplacehoder
                          : 'Currency Type'
                      }`}
                      value={
                        values.currency ||
                        (props.currencytype ? props.currencytype[0] : '')
                      }
                      onChange={(val: string) => {
                        setFieldValue('currency', val);
                        props?.onFilterChange?.({ ...values, currency: val });
                      }}
                      isSearchable={false}
                    />
                  )}
                </div>
              )}
              {props.startDate && (
                <div className="filter_date">
                  {props.startDate && (
                    <FormControl
                      control="date"
                      name="startDate"
                      value={values.startDate || null}
                      calendarIcon={<CalendarIcon />}
                      minDate={props.startDateMin}
                      maxDate={props.startDateMax}
                      error={
                        touched.startDate && errors.startDate
                          ? errors.startDate
                          : undefined
                      }
                      onChange={(date: Date | null) => {
                        setFieldError('startDate', undefined);
                        setFieldError('endDate', undefined);

                        if (date && values.endDate && date > values.endDate) {
                          // If start date is after end date, clear end date
                          setFieldValue('endDate', null);
                          setFieldValue('startDate', date);
                          props?.onFilterChange?.({
                            ...values,
                            startDate: date,
                            endDate: null,
                          });
                        } else {
                          setFieldValue('startDate', date);
                          props?.onFilterChange?.({ ...values, startDate: date });
                        }
                      }}
                    />
                  )}
                  {props.endDate && (
                    <FormControl
                      control="date"
                      name="endDate"
                      value={values.endDate || null}
                      calendarIcon={<CalendarIcon />}
                      minDate={
                        values.startDate || props.endDateMin || props.startDateMin
                      }
                      maxDate={props.endDateMax}
                      error={
                        touched.endDate && errors.endDate
                          ? errors.endDate
                          : undefined
                      }
                      onChange={(date: Date | null) => {
                        setFieldError('endDate', undefined);

                        if (date && values.startDate && date < values.startDate) {
                          setFieldError(
                            'endDate',
                            'End date must be after or equal to start date'
                          );
                          return;
                        }

                        setFieldValue('endDate', date);
                        props?.onFilterChange?.({ ...values, endDate: date });
                      }}
                    />
                  )}
                </div>
              )}
              {props?.clearFiltersBtnTitle && (
                <div className="filter_btns">
                  {props?.clearFiltersBtnTitle && (
                    <CommonButton
                      title={props.clearFiltersBtnTitle}
                      onClick={() => {
                        resetForm({ values: initialValues });
                        props?.onFilterChange?.(initialValues);
                        props?.onClearFiltersClick?.();
                      }}
                      type="button"
                      className="filterblue_btn"
                      disabled={props.clearFiltersBtnDisabled}
                    />
                  )}
                </div>
              )}
              {(props?.btntitle || props?.csvBtnTitle) && (
                <div className="filter_btns">
                  {props.btntitle && (
                    <CommonButton
                      title={props.btntitle}
                      onClick={props.btnClick}
                      type="submit"
                      className="filterblue_btn"
                      disabled={props.btnDisabled}
                    />
                  )}
                  {props?.csvBtnTitle && (
                    <CommonButton
                      title={props.csvBtnTitle}
                      onClick={props.onCsvClick}
                      type="button"
                      className="filterblue_btn"
                      disabled={props.csvDisabled}
                    />
                  )}
                </div>
              )}
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CommonFilter;
