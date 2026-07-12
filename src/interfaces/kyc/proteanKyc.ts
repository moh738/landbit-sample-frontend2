/**
 * Protean KYC flow types.
 * Flow: ID Upload (Voter ID / DL / Passport) → Face Liveness → Face Match → OCR + Name Match → Submit
 */

import type { KycVerificationSteps } from '../responses/responses';

export type ProteanKycIdType = 'voter_id' | 'driving_licence' | 'passport';

export type ProteanKycStep =
  | 'id_upload'
  | 'face_liveness'
  | 'face_match'
  | 'details_and_name_match'
  | 'submit';

/** Indian flow: upload ID -> verify extracted details -> face liveness */
export type IndianProteanKycStep = 'id_upload' | 'document_verify' | 'face_liveness';

/**
 * Maps GET /user/kyc/status `verificationSteps` to the Indian flow screen to open.
 * Pipeline order: OCR → document verify → liveness.
 * Returns null when all flags are true (stay on overview or current navigation).
 */
export function getIndianKycStepFromVerificationSteps(
  steps: KycVerificationSteps
): IndianProteanKycStep | null {
  // Treat anything that is not explicitly `true` as incomplete (API may omit keys on reject / edge cases).
  if (steps.ocr !== true) return 'id_upload';
  if (steps.docVerify !== true) return 'document_verify';
  if (steps.liveness !== true) return 'face_liveness';
  return null;
}

/** True when the user still has an in-app step (upload / verify doc / liveness). False when waiting on admin or provider-only checks (e.g. name match). */
export function hasIncompleteIndianKycDomesticSteps(
  steps: KycVerificationSteps | null | undefined
): boolean {
  if (!steps) return false;
  return getIndianKycStepFromVerificationSteps(steps) !== null;
}

/** Display label and API doc type for each ID */
export const PROTEAN_ID_TYPE_OPTIONS: { value: ProteanKycIdType; label: string }[] = [
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'driving_licence', label: 'Driving Licence' },
  { value: 'passport', label: 'Passport' },
];

/**
 * Map GET `/user/kyc/details` `documentType` (and similar labels) to the domestic flow id selector.
 * Handles API values like `VOTER`, `DL`, `Passport`, `Driving License`, etc.
 */
export function mapApiDocumentTypeToProteanIdType(
  raw: string | undefined | null
): ProteanKycIdType | '' {
  if (raw == null || typeof raw !== 'string') return '';
  const s = raw.trim().toLowerCase();
  if (!s) return '';
  if (s === 'voter' || s === 'voter_id' || s.includes('voter')) return 'voter_id';
  if (s === 'dl' || s.includes('driving')) return 'driving_licence';
  if (s === 'passport' || s.includes('passport')) return 'passport';
  return '';
}

/** OCR extracted data from ID (structure depends on Protean response; backend normalizes) */
export interface ProteanOcrData {
  name?: string;
  fatherName?: string;
  dob?: string;
  documentNumber?: string;
  address?: string;
  raw?: Record<string, unknown>;
}

/** Face liveness API response */
export interface ProteanLivenessResponse {
  success?: boolean;
  liveness?: boolean;
  message?: string;
}

/** Face match API response */
export interface ProteanFaceMatchResponse {
  success?: boolean;
  match?: boolean;
  score?: number;
  message?: string;
}

/** Name match API response */
export interface ProteanNameMatchResponse {
  success?: boolean;
  match?: boolean;
  score?: number;
  message?: string;
}

/** Payload we send to backend for final KYC submit (Protean flow) */
export interface ProteanKycSubmitPayload {
  documentType: string; // 'Voter ID' | 'Driving License' | 'Passport'
  documentUrl: string;
  fullName: string;
  residentialAddress: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
  /** Selfie image URL (from liveness step) */
  selfieImageUrl?: string;
  /** OCR extracted name for audit */
  ocrName?: string;
  /** Protean verification results for backend to store */
  proteanResults?: {
    liveness?: ProteanLivenessResponse;
    faceMatch?: ProteanFaceMatchResponse;
    nameMatch?: ProteanNameMatchResponse;
    ocr?: ProteanOcrData;
  };
}

/** Indian user: 2-step flow only. Backend handles OCR, face match, name match. */
export interface IndianProteanKycSubmitPayload {
  documentType: string;
  /** Front side of ID document (required). */
  documentUrl: string;
  /** Back side of ID document (optional for Passport; required for Voter ID / Driving Licence). */
  documentUrlBack?: string;
  selfieImageUrl: string;
  fullName?: string; // from profile, for backend
}
