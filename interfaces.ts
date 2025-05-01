import {
  BookingStatus,
  Category,
  LoginProvider,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  PerchTypes,
  QUEUE_NAME,
  UserType,
} from 'enums';
import { Location } from 'rdbms/entities/Location.entity';
import { User } from 'rdbms/entities/User.entity';

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
  location: Location;
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
  limit?: number;
  category?: Category;
  from?: UserType;
  bookingStatus?: BookingStatus;
  perchType?: PerchTypes;
  searchTerm?: string;
  periodOfStay?: string;
  numberOfGuests?: number;
}

export interface IPersist<T> {
  isPersist: boolean;
  msg: string;
  payload: T;
}

export interface INotification {
  user: User | null | undefined;
  type: NotificationType;
  status?: NotificationStatus;
  title: string;
  message: string;
  channel: NotificationChannel;
  data?: any;
}
