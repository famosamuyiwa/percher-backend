// src/utils/validation-log.helper.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export async function handleResponse(response) {
  try {
    console.log(response);

    return {
      status: 'success',
      code: 201,
      data: response,
    };
  } catch (err) {
    console.log(err);

    // Check if the error is a ConflictException
    if (err instanceof HttpException) {
      console.log(`${err}`);
    } else {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

export function generateReferralCode(username = '') {
  // Take the first 3 letters of the username (or a default if unavailable)
  const prefix = username.slice(0, 3).toUpperCase() || 'USR';

  // Generate a random 6-character alphanumeric string
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Combine prefix and random string
  return `${prefix}-${randomString}`;
}

export const to2DecimalPoints = (value: number) => {
  return Number(value.toFixed(2));
};

export const handleError = (err) => {
  console.error(err);
  if (err instanceof HttpException) {
    throw err;
  } else {
    throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

export const generateOTP = (length: number) => {
  let otp = '';
  const characters = '0123456789'; // Use digits for OTP

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    otp += characters[randomIndex];
  }

  return otp;
};
