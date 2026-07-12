import { ReactNode } from 'react';
import { Table } from 'react-bootstrap';
import { NoRecordIcon } from '../../../assets/icons/SvgIcon';
import './CommonTable.scss';
type TProps = {
  children?: ReactNode;
  fields?: any;
  tableTitle?: string;
  lastColumnWidth?: string;
  className?: string;
};
const CommonTable = (props: TProps) => {
  return (
    <>
      <div className={`table_box ${props.className}`}>
        {props.tableTitle && <h4 className="table_heading">{props.tableTitle}</h4>}
        <Table responsive>
          {props.fields && (
            <thead>
              <tr>
                {props.fields?.map((item: any, index: number) => {
                  const isLast = index === props.fields.length - 1;
                  return (
                    <th
                      key={item}
                      style={isLast ? { width: props.lastColumnWidth } : {}}
                    >
                      {item}
                    </th>
                  );
                })}
              </tr>
            </thead>
          )}
          <tbody>
            {props.children || (
              <tr>
                <td colSpan={props.fields?.length} className="no_record_box">
                  <NoRecordIcon />
                  <p>No Record Found</p>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );
};
export default CommonTable;
