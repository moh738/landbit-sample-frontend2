import { useSelector } from 'react-redux';
import './Loader.scss';

const Loader = () => {
  const isLoading = useSelector((state: any) => state.loader.isLoading);

  if (isLoading) {
    return (
      <div className="loader">
        <div className="loader_inner">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    );
  } else {
    return <></>;
  }
};

export default Loader;
