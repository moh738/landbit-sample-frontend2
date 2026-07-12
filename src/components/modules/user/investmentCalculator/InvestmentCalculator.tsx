import { Col, Row } from 'react-bootstrap';
import CommonHeading from '../../../common/commonHeading/CommonHeading';
import './InvestmentCalculator.scss';
import CalculatorRange from './calculatorRange/CalculatorRange';
import CalculatorPieChart from './calculatorPieChart/CalculatorPieChart';
import { useMemo, useState } from 'react';

const InvestmentCalculator = () => {

  const [investment, setInvestment] = useState<number>(5000000);
  const [growth, setGrowth] = useState<number>(30);
  const [rentalYield, setRentalYield] = useState<number>(10);
  const years = 5;

  const { rentalIncome, appreciation, totalReturn, finalValue, roi } = useMemo(() => {

    const rentalIncome = investment * (rentalYield / 100) * years;
    const appreciation = investment * (growth / 100);
    const totalReturn = rentalIncome + appreciation;
    const finalValue = investment + totalReturn;
    const roi = (totalReturn / investment) * 100;

    return { rentalIncome, appreciation, totalReturn, finalValue, roi };

  }, [investment, growth, rentalYield, years]);

  const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });


  return (
    <>
      <section className="investmentcalculator">
        <CommonHeading heading="Investment Calculator" />
        <Row>
          <Col xs={12} md={6} className="mb-5 mb-md-0">
            <div className="investmentcalculator_procard">
              <CalculatorRange
                title="Initial Investment"
                value={`₹${fmt(investment)}`}
                min={10000}
                max={10000000}
                step={10000}
                onChange={(v: number) => setInvestment(v)}
              />

              <CalculatorRange
                title={`Property Value Growth (${years} years)`}
                value={`${growth}%`}
                min={0}
                max={100}
                step={1}
                onChange={(value: number) => setGrowth(value)}
              />

              <CalculatorRange
                title="Expected Annual Rental Yield"
                value={`${rentalYield}%`}
                min={0}
                max={100}
                step={1}
                onChange={(value: number) => setRentalYield(value)}
              />
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="investmentcalculator_piecard">
              <h3>
                Projected investment returns of <span>₹ {fmt(investment)}</span> in{' '}
                <span>{years} years</span>
              </h3>
              <div className="piechart">
                <CalculatorPieChart
                  data={[
                    { name: 'Investment', value: investment },
                    { name: 'Total Rental Income', value: rentalIncome },
                    { name: 'Value Appreciation', value: appreciation },
                  ]}
                />
                <div className="piechart_list">
                  <ul>
                    <li>
                      <span className="icon blue"></span>
                      <p className="text-truncate">
                        <span>₹{fmt(investment)}</span> Investment
                      </p>
                    </li>
                    <li>
                      <span className="icon lightblue"></span>
                      <p className="text-truncate">
                        <span>₹{fmt(appreciation)}</span> Value Appreciation
                      </p>
                    </li>
                    <li>
                      <span className="icon green"></span>
                      <p className="text-truncate">
                        <span>₹{fmt(rentalIncome)}</span> Total Rental Income
                      </p>
                    </li>
                    <li>
                      <p className="text-truncate">
                        <span>Total Return</span>  <span>₹{fmt(finalValue)}</span> ({fmt(totalReturn)} gain)
                      </p>
                    </li>
                    <li>
                      <p className="text-truncate">
                        <span>Overall Growth:</span> {roi?.toFixed(1)}%
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </section>
    </>
  );
};

export default InvestmentCalculator;
