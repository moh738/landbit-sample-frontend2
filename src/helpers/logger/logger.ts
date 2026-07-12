import packageJson from '../../../package.json';
import { ENVIRONMENT } from '../../utils/config';

const version = packageJson.version;

const disableConsoles = () => {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
  console.error = () => {};
};

const logAppInfo = () => {
  if (ENVIRONMENT === 'dev' || ENVIRONMENT === 'stage' || ENVIRONMENT === 'prod') {
    console.log(
      '%cApp Version:%c ' + version,
      'color: gray; font-weight: bold;',
      'color: green; font-weight: bold;'
    );
  } else if (ENVIRONMENT === 'prod') {
    disableConsoles();
  }
};

export { logAppInfo };
