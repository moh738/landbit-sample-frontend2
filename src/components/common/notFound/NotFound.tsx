import CommonButton from '../../ui/commonButton/CommonButton';
import './NotFound.scss';
const NotFound = () => {
  return (
    <section className="not_found">
      <h1>Oops!</h1>
      <h2>404 Page Not Found</h2>
      <p>The page your are looking for isn't found or is temporarily unavailable.</p>
      <CommonButton title="Go to Home" role="link" to="/" />
    </section>
  );
};

export default NotFound;
