export type AppLanguage = 'en' | 'kn';
export type AppRole = 'CUSTOMER' | 'PROVIDER';

export interface FirebaseIdentity {
  uid: string;
  phoneNumber: string | null;
  signInProvider: string | null;
  /** Present only when the ID token contains Firebase multi-factor claims. */
  signInSecondFactor?: string | null;
  authTime?: number;
}

export interface PhoneVerifiedFirebaseIdentity extends FirebaseIdentity {
  phoneNumber: string;
  signInProvider: 'phone';
}

export interface AppSession {
  user: {
    id: string;
    phoneNumber: string;
    fullName: string | null;
    preferredLanguage: AppLanguage;
  };
  roles: AppRole[];
  onboardingComplete: boolean;
}

export interface AuthUserStore {
  syncPhoneAccount(
    identity: PhoneVerifiedFirebaseIdentity,
    preferredLanguage: AppLanguage | undefined,
  ): Promise<AppSession>;
  findSession(firebaseUid: string): Promise<AppSession | null>;
  addRole(firebaseUid: string, role: AppRole): Promise<AppSession | null>;
}

export class PhoneNumberAlreadyLinkedError extends Error {
  constructor() {
    super('Phone number is already linked to another account.');
    this.name = 'PhoneNumberAlreadyLinkedError';
  }
}

export class AccountNotActiveError extends Error {
  constructor() {
    super('Account is not active.');
    this.name = 'AccountNotActiveError';
  }
}
