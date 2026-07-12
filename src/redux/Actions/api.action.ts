import {
  CallDeleteMethodParams,
  CallGetMethodParams,
  CallPostMethodParams,
  CallPutMethodParams,
} from '../../interfaces/apis/apiTypes';
import {
  axiosDeleteRequest,
  axiosGetRequest,
  axiosPostRequest,
  axiosPutRequest,
} from '../../services/api.service';
import { buttonLoader, loader } from '../Slices/loader.slice';

/**
 * Call Get Method.
 *
 * @param apiUrl       - The API endpoint URL
 * @param params       - Query parameters for GET
 * @param showToaster  - Whether to show toaster messages
 * @param dispatch     - Redux dispatch function
 * @param setLoader    - Redux action for page loader
 * @param setButtonLoader - Redux action for button loader
 * @param buttonKey    - Key for which button loader to toggle
 */
export const callGetMethod = async ({
  apiUrl,
  endpoint,
  params = {},
  showToaster = false,
  dispatch,
  showLoader,
  showButtonLoader,
  buttonKey,
  token,
  customToken,
}: CallGetMethodParams) => {
  try {
    if (showLoader) 
      dispatch(loader(true));
    if (showButtonLoader && buttonKey) dispatch(buttonLoader({ [buttonKey]: true }));

    const data = await axiosGetRequest(
      apiUrl,
      endpoint,
      params,
      showToaster,
      token,
      customToken
    );
    return data;
  } catch (error) {
    throw error;
  } finally {
    if (showLoader) dispatch(loader(false));
    if (showButtonLoader && buttonKey)
      dispatch(buttonLoader({ [buttonKey]: false }));
  }
};

export const callPostMethod = async ({
  apiUrl,
  endpoint,
  data = {},
  params = {},
  showToaster = false,
  dispatch,
  showLoader = false,
  showButtonLoader = false,
  buttonKey,
  token,
  customToken,
}: CallPostMethodParams) => {
  try {
    if (showLoader) dispatch(loader(true));
    if (showButtonLoader && buttonKey) dispatch(buttonLoader({ [buttonKey]: true }));

    const response = await axiosPostRequest(
      apiUrl,
      endpoint,
      data,
      params,
      showToaster,
      token,
      customToken
    );
    return response;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error.message ||
      'An error occurred';
    if (showToaster) {
      console.error(errorMessage);
    }
    return {
      success: false,
      statusCode: error?.response?.status,
      message: errorMessage,
    };
  } finally {
    dispatch(loader(false));
    if (showButtonLoader && buttonKey)
      dispatch(buttonLoader({ [buttonKey]: false }));
  }
};

export const callPutMethod = async ({
  apiUrl,
  endpoint,
  data = {},
  params = {},
  showToaster = false,
  dispatch,
  showLoader = false,
  showButtonLoader = false,
  buttonKey,
  token,
  customToken,
}: CallPutMethodParams) => {
  try {
    if (showLoader) dispatch(loader(true));
    if (showButtonLoader && buttonKey) dispatch(buttonLoader({ [buttonKey]: true }));

    const response = await axiosPutRequest(
      apiUrl,
      endpoint,
      data,
      params,
      showToaster,
      token,
      customToken
    );
    return response;
  } catch (error) {
    throw error;
  } finally {
    if (showLoader) dispatch(loader(false));
    if (showButtonLoader && buttonKey)
      dispatch(buttonLoader({ [buttonKey]: false }));
  }
};

export const callDeleteMethod = async ({
  apiUrl,
  endpoint,
  params = {},
  showToaster = false,
  dispatch,
  showLoader = false,
  showButtonLoader = false,
  buttonKey,
}: CallDeleteMethodParams) => {
  try {
    if (showLoader) dispatch(loader(true));
    if (showButtonLoader && buttonKey) dispatch(buttonLoader({ [buttonKey]: true }));

    const response = await axiosDeleteRequest(apiUrl, endpoint, params, showToaster);
    return response;
  } catch (error) {
    throw error;
  } finally {
    if (showLoader) dispatch(loader(false));
    if (showButtonLoader && buttonKey)
      dispatch(buttonLoader({ [buttonKey]: false }));
  }
};
