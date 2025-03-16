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

export enum LoginProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  MAIL = 'mail',
}

export interface OAuthRequest {
  provider: LoginProvider;
  name: string;
  email: string;
}

export enum QueryBy {
  EMAIL = 'email',
}
