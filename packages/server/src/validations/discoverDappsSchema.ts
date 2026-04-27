import { z } from 'zod';

export const DappStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

export type DappStatus = typeof DappStatus[keyof typeof DappStatus];

export const createDiscoverDappSchema = z.object({
    title: z
        .string()
        .min(2, { message: 'Title must be at least 2 characters long' })
        .max(255, { message: 'Title cannot exceed 255 characters' })
        .trim(),
    status: z
        .enum([DappStatus.ACTIVE, DappStatus.INACTIVE])
        .default(DappStatus.ACTIVE),
    categoryId: z.string().uuid({ message: 'Invalid category ID' }).optional(),
    description: z
        .string()
        .max(1000, { message: 'Description cannot exceed 1000 characters' })
        .optional(),
    logo: z.string().url({ message: 'Logo must be a valid URL' }).optional(),
    link: z.string().url({ message: 'Link must be a valid URL' }),
});

export const updateDiscoverDappSchema = z.object({
    title: z
        .string()
        .min(2, { message: 'Title must be at least 2 characters long' })
        .max(255, { message: 'Title cannot exceed 255 characters' })
        .trim()
        .optional(),
    status: z.enum([DappStatus.ACTIVE, DappStatus.INACTIVE]).optional(),
    categoryId: z.string().uuid({ message: 'Invalid category ID' }).nullable().optional(),
    description: z
        .string()
        .max(1000, { message: 'Description cannot exceed 1000 characters' })
        .optional(),
    logo: z.string().url({ message: 'Logo must be a valid URL' }).nullable().optional(),
    link: z.string().url({ message: 'Link must be a valid URL' }).optional(),
});

export type CreateDiscoverDappInput = z.infer<typeof createDiscoverDappSchema>;
export type UpdateDiscoverDappInput = z.infer<typeof updateDiscoverDappSchema>;
