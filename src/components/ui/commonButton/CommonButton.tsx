import { ReactNode } from 'react';
import { Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './CommonButton.scss';

const CommonButton = ({
  title,
  className,
  svgIcon,
  imageIcon,
  onClick,
  to,
  role,
  type,
  disabled,
  isLoading,
  fluid,
  text,
  children,
  ref,
}: {
  title?: any;
  className?: string;
  svgIcon?: ReactNode;
  imageIcon?: string;
  onClick?: any;
  to?: any;
  id?: string;
  role?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  isLoading?: boolean;
  fluid?: boolean;
  text?: string;
  children?: ReactNode;
  ref?: any;
}) => {
  return (
    <>
      {(() => {
        switch (role) {
          case 'link':
            return (
              <Link
                to={to}
                className={`common_btn ${fluid ? 'full' : ''} ${className}`}
                ref={ref}
                onClick={onClick}
              >
                {svgIcon && (
                  <>
                    <span className="common_btn_icon">{svgIcon}</span>
                  </>
                )}
                {imageIcon && (
                  <>
                    <span className="common_btn_icon">
                      <img src={imageIcon} alt="" />
                    </span>
                  </>
                )}
                {title && <>{title}</>}
                {isLoading ? <Spinner /> : text}
                {children}
              </Link>
            );
          default:
            return (
              <button
                className={`common_btn ${fluid ? 'full' : ''} ${className}`}
                onClick={onClick}
                disabled={disabled}
                type={type ? type : 'button'}
                ref={ref}
              >
                {svgIcon && (
                  <>
                    <span className="common_btn_icon">{svgIcon}</span>
                  </>
                )}
                {imageIcon && (
                  <>
                    <span className="common_btn_icon">
                      <img src={imageIcon} alt="" />
                    </span>
                  </>
                )}
                {title && <>{title}</>}
                {isLoading ? <Spinner /> : text}
                {children}
              </button>
            );
        }
      })()}
    </>
  );
};
export default CommonButton;
