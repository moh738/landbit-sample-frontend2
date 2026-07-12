import { useState } from 'react';

import './ExtraInfoCard.scss';
import { truncateMiddle } from '../../../../../../helpers/user/maskEmail';

const TRUNCATE_LEN = 30;

const ExtraInfoCard = ({ items }: { items?: any }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggle = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <>
      <ul className="ei-card">
        {items?.map((item: any, index: any) => {
          const isExpandable =
            item?.expandable &&
            typeof item?.subTitle === 'string' &&
            item.subTitle.length > (item.truncateLength ?? TRUNCATE_LEN);
          const len = item?.truncateLength ?? TRUNCATE_LEN;
          const isExpanded = expanded[index];
          const displayText = isExpandable
            ? isExpanded
              ? item.subTitle
              : truncateMiddle(item.subTitle, len)
            : item.subTitle;

          return (
            <li key={index}>
              <span>{item.title}</span>
              <p title={item.subTitleTitle ?? undefined}>
                {displayText}
                {isExpandable && (
                  <button
                    type="button"
                    className="ei-card_toggle"
                    onClick={() => toggle(index)}
                  >
                    {isExpanded ? ' Show less' : ' Show more'}
                  </button>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default ExtraInfoCard;
