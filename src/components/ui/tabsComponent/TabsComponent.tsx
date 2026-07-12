import React from 'react';
import { Nav } from 'react-bootstrap';
import './TabsComponent.scss';
import ToggleSwitch from '../toggleSwitch/ToggleSwitch';
import { useDispatch, useSelector } from 'react-redux';
import { setEquityEnable } from '../../../redux/Slices/user.slice';

interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}
const TabsComponent = ({
  tabItems,
  activeTab,
  onSelect,
  className,
  showToggle,
  text
}: {
  tabItems: TabItem[];
  activeTab: string | any;
  onSelect: (key: string | null) => void;
  className?: string;
  showToggle?: boolean
  text?: string
}) => {

  const dispatch = useDispatch();
  const equityEnable = useSelector((state: RootState) => state?.user?.equityEnable);

  return (
    <>
      <Nav
        variant="tabs"
        activeKey={activeTab}
        onSelect={onSelect}
        className={`common_tabs ${className}`}
      >
        {tabItems.map((tab) => (
          <Nav.Item key={tab.key}>
            <Nav.Link
              eventKey={tab.key}
              disabled={tab.disabled}
              className={tab.className}
            >
              {tab.icon && <span className="tab-icon">{tab.icon}</span>}
              {tab.label}
            </Nav.Link>
          </Nav.Item>
        ))}
        {showToggle && <ToggleSwitch
          text={text}
          isChecked={equityEnable}
          onChange={() => dispatch(setEquityEnable(!equityEnable))}
          className="ms-2"
        />}
      </Nav>
    </>
  );
};

export default TabsComponent;
