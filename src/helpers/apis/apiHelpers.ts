import Toast from '../../components/common/Toast';

/** CREATE URL FOR API CALL WITH PARAMS */
export const formatUrl = (url: string, params?: Record<string, any>) => {
  const queryString =
    params && Object.keys(params).length > 0
      ? `?${new URLSearchParams(params).toString()}`
      : ``;
  const formattedUrl = `${url}${queryString}`;
  const decodedUrl = decodeURIComponent(formattedUrl);
  return decodedUrl;
};

export const handleError = (error: any) => {
  Toast.error(error);
};
