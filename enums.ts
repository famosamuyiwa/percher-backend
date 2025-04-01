export enum Facility {
  LAUNDRY = 'Laundry',
  GARAGE = 'Garage',
  GYM = 'Gym',
  WIFI = 'WiFi',
  FURNISHED = 'Furnished',
  PET_FRIENDLY = 'Pet Friendly',
  ESTATE_SECURITY = 'Estate Security',
  POOL = 'Pool',
  ELECTRICITY_24_7 = '24/7 Electricity',
  CCTV = 'CCTV',
}

export enum PerchTypes {
  APARTMENT = 'Apartment', // Serviced or not
  HOUSE = 'House',
  VILLA = 'Villa',
  MANSION = 'Mansion',
  PENTHOUSE = 'Penthouse',
  SELF_CONTAINED = 'Self-Contained',
  BOYS_QUARTERS = "Boys' Quarters",
  OFFICE_SPACE = 'Office Space',
  WAREHOUSE = 'Warehouse',
  EVENT_CENTER = 'Event Center',
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
  DRAFT = 'Draft',
}

export enum TransactionType {
  DEPOSIT = 'Deposit',
  WITHDRAWAL = 'Withdrawal',
  BOOKING = 'Booking',
  REFUND = 'Booking Refund',
  CAUTION_FEE_CASHBACK = 'Caution Fee Cashback',
  OTHER = 'Other',
}

export enum TransactionMode {
  DEBIT = 'Debit',
  CREDIT = 'Credit',
}

export enum TransactionStatus {
  PENDING = 'Pending',
  PROCESSED = 'Processed',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
}

export enum PaymentType {
  CHARGE = 'Charge',
  DRAFT = 'Draft',
}

export enum PaymentStatus {
  SUCCESS = 'success',
  PENDING = 'pending',
}

export enum ReviewAction {
  APPROVE = 'Approve',
  REJECT = 'Reject',
}

export enum NotificationType {
  BOOKING_REQUEST = 'Booking Request',
  BOOKING_APPROVED = 'Booking Approved',
  BOOKING_REJECTED = 'Booking Rejected',
  PAYMENT_SUCCESS = 'Payment Success',
  PAYMENT_FAILED = 'Payment Failed',
  REFUND = 'Refund',
  SYSTEM = 'System',
}

export enum NotificationStatus {
  UNREAD = 'Unread',
  READ = 'Read',
}
