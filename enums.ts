export enum Facility {
  LAUNDRY = 'Laundry',
  GARAGE = 'Garage',
  GYM = 'Gym',
  WIFI = 'Wifi',
}

export enum PerchTypes {
  HOUSE = 'House',
  CONDO = 'Condo',
  DUPLEX = 'Duplex',
  STUDIO = 'Studio',
  VILLA = 'Villa',
  APARTMENT = 'Apartment',
  OTHERS = 'Others',
}

export enum ChargeType {
  NIGHTLY = 'Nightly',
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
}

export enum QueryBy {
  EMAIL = 'email',
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

export const defaultAvatar =
  'https://f003.backblazeb2.com/file/percher-multimedia/avatar-placeholder.jpg';

export enum Category {
  FEATURED = 'Featured',
  RECOMMENDATION = 'Recommendation',
}

export enum RegistrationStatus {
  IN_REVIEW = 'In Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum UserType {
  HOST = 'Host',
  GUEST = 'Guest',
}

export enum BookingStatus {
  CURRENT = 'Current',
  UPCOMING = 'Upcoming',
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

export enum TransactionStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
}

export enum TransactionType {
  DEPOSIT = 'Deposit',
  WITHDRAWAL = 'Withdrawal',
  BOOKING = 'Booking',
  REFUND = 'Refund',
  OTHER = 'Other',
}

export enum PaymentStatus {
  SUCCESS = 'success',
}
