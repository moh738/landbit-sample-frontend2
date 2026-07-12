import ReactRangeSliderInput from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';
import './CalculatorRange.scss';

const CalculatorRange = ({
  title,
  value,
  min,
  max,
  step,
  onChange
}: any) => {
  
  const numericValue = parseFloat(value.toString().replace(/[^0-9.]/g, ''));

  return (
    <div className="calculatorrange">
      <div className="calculatorrange_value">
        <h4>{title}</h4>
        <h3>{value}</h3>
      </div>

      <ReactRangeSliderInput
        className="single-thumb"
        min={min}
        max={max}
        step={step}
        value={[min, numericValue]}
        thumbsDisabled={[true, false]}
        rangeSlideDisabled={true}
        onInput={(val: any) => {
          const selectedValue = val[1];
          onChange(selectedValue);
        }}
      />
    </div>
  );
};

export default CalculatorRange;
