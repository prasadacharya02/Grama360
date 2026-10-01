import { createHash } from 'node:crypto';

import type { ProviderRegistrationInput } from './provider.types.js';

export function normalizeProviderInput(input: ProviderRegistrationInput): ProviderRegistrationInput {
  return {
    ...input,
    displayName: input.displayName.trim(),
    businessName: input.businessName?.trim() || null,
    secondaryPhoneNumber: input.secondaryPhoneNumber?.trim() || null,
    description: input.description?.trim() || null,
    profilePhotoPath: input.profilePhotoPath?.trim() || null,
    location: {
      locality: input.location.locality.trim(),
      taluk: input.location.taluk?.trim() || null,
      district: input.location.district.trim(),
      languageCode: input.location.languageCode,
    },
  };
}

export function manualLocationSlug(location: ProviderRegistrationInput['location']): string {
  // Match the database's locality/district identity; taluk is descriptive, not a key.
  const key = [
    location.languageCode,
    location.locality.normalize('NFKC').toLocaleLowerCase('en-IN'),
    location.district.normalize('NFKC').toLocaleLowerCase('en-IN'),
    'karnataka',
  ].join('|');
  return `manual-${createHash('sha256').update(key).digest('hex').slice(0, 40)}`;
}
