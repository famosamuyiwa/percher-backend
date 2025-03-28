import {
  BookingStatus,
  Category,
  LoginProvider,
  PerchTypes,
  UserType,
} from 'enums';

export interface ApiResponse<T = any> {
  code: number;
  status: string;
  message: string;
  data: T;
}

export interface OAuthRequest {
  provider: LoginProvider;
  name: string;
  email: string;
}

export interface PerchRegistrationFormData {
  propertyName: string;
  propertyType: string;
  chargeType: string;
  beds: number;
  bathrooms: number;
  description: string;
  header: string;
  location: string;
  price: number;
  cautionFee: number;
  gallery: string[];
  proofOfOwnership: string[];
  proofOfIdentity: string[];
  txc: boolean;
  facilities: string[];
  checkInTimes: string[];
  checkOutTime: string;
}

export interface Filter {
  location?: string;
  type?: PerchTypes;
  limit?: number;
  category?: Category;
  from?: UserType;
  bookingStatus?: BookingStatus;
}
