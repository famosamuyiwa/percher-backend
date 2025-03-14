export interface ApiResponse<T = any> {
  code: number;
  status: string;
  message: string;
  data: T;
}

export enum ResponseStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}
