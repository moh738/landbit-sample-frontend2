import type { AppDispatch } from '../../redux/Store';
import { AxiosInstance } from 'axios';

/** Base API Method Params */
interface BaseApiMethodParams {
  apiUrl: AxiosInstance;
  endpoint: string;
  showToaster?: boolean;
  dispatch: AppDispatch;
  showLoader: boolean;
  showButtonLoader: boolean;
  buttonKey?: string;
}

/** GET and DELETE use params */
export interface CallGetMethodParams extends BaseApiMethodParams {
  params?: Record<string, any>;
  token?: boolean;
  customToken?: string;
}

export interface CallDeleteMethodParams extends BaseApiMethodParams {
  params?: Record<string, any>;
}

/** POST and PUT use data */
export interface CallPostMethodParams extends BaseApiMethodParams {
  data?: Record<string, any>;
  params?: Record<string, any>;
  token?: boolean;
  customToken?: string;
}

export interface CallPutMethodParams extends BaseApiMethodParams {
  data?: Record<string, any>;
  params?: Record<string, any>;
  token?: boolean;
  customToken?: string;
}
