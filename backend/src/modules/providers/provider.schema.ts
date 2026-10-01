import { z } from 'zod';

const phoneNumberSchema = z.string().regex(/^\+[1-9][0-9]{7,14}$/);
const timeSchema = z.string().regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/);

export const workingHourSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    isClosed: z.boolean(),
    opensAt: timeSchema.nullable(),
    closesAt: timeSchema.nullable(),
  })
  .strict()
  .superRefine((hour, context) => {
    if (hour.isClosed) {
      if (hour.opensAt !== null || hour.closesAt !== null) {
        context.addIssue({ code: 'custom', message: 'Closed days must not include times.' });
      }
      return;
    }

    if (hour.opensAt === null || hour.closesAt === null || hour.opensAt >= hour.closesAt) {
      context.addIssue({ code: 'custom', message: 'Working hours must have a valid time range.' });
    }
  });

export const providerRegistrationSchema = z
  .object({
    displayName: z.string().trim().min(1).max(120),
    businessName: z.string().trim().max(120).nullable().optional(),
    secondaryPhoneNumber: phoneNumberSchema.nullable().optional(),
    serviceRadiusKm: z.number().min(1).max(200),
    experienceYears: z.number().int().min(0).max(80),
    description: z.string().trim().max(2000).nullable().optional(),
    profilePhotoPath: z.string().max(512).nullable().optional(),
    serviceIds: z.array(z.string().uuid()).min(1).max(5).refine(
      (ids) => new Set(ids).size === ids.length,
      'Duplicate service categories are not allowed.',
    ),
    languages: z.array(z.enum(['kn', 'en', 'tcy'])).min(1).max(3).refine(
      (values) => new Set(values).size === values.length,
      'Duplicate spoken languages are not allowed.',
    ),
    location: z
      .object({
        locality: z.string().trim().min(1).max(120),
        taluk: z.string().trim().max(120).nullable().optional(),
        district: z.string().trim().min(1).max(120),
        languageCode: z.enum(['en', 'kn']),
      })
      .strict(),
    workingHours: z.array(workingHourSchema).length(7).superRefine((hours, context) => {
      const weekdays = hours.map((hour) => hour.weekday);
      if (new Set(weekdays).size !== 7) {
        context.addIssue({ code: 'custom', message: 'Each weekday must be included exactly once.' });
      }
      if (hours.every((hour) => hour.isClosed)) {
        context.addIssue({ code: 'custom', message: 'At least one working day is required.' });
      }
    }),
  })
  .strict();

export { phoneNumberSchema };
