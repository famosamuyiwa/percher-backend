// src/utils/validation-log.helper.ts
import { HttpException, HttpStatus } from '@nestjs/common';
import { MediaUploadType, ReviewAction, RegistrationStatus } from 'enums';
import { Property } from 'rdbms/entities/Property.entity';
import { MediaUpload } from 'rdbms/entities/MediaUpload';
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

export const getEnvVariable = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set in environment variables`);
  }
  return value;
};

export function getFilteredPropertyMedia(mediaUploads: MediaUpload[]) {
  if (!mediaUploads)
    return {
      gallery: [],
      proofOfIdentity: [],
      proofOfOwnership: [],
    };

  const filteredMediaList = {
    gallery: [],
    proofOfIdentity: [],
    proofOfOwnership: [],
  };
  mediaUploads.map((media: any) => {
    filteredMediaList[media.mediaType].push(media.mediaUrl);
  });
  return filteredMediaList;
}

export function getStatusFromAction(action: ReviewAction) {
  switch (action) {
    case ReviewAction.APPROVE:
      return RegistrationStatus.APPROVED;
    case ReviewAction.REJECT:
      return RegistrationStatus.REJECTED;
  }
}
