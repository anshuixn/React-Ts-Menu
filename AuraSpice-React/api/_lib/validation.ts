import { z } from 'zod';

const staffIdSchema = z
  .string()
  .trim()
  .min(1, 'Staff ID is required')
  .max(32, 'Staff ID must be 32 characters or fewer')
  .regex(/^[A-Za-z0-9_]+$/, 'Staff ID may only contain letters, numbers, and underscores');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be 128 characters or fewer');

const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(64, 'Name must be 64 characters or fewer');

const establishmentKeySchema = z
  .string()
  .trim()
  .min(12, 'Establishment key must be at least 12 characters long')
  .max(128, 'Establishment key must be 128 characters or fewer')
  .regex(/^[\w\-!@#$%^&*+=.:/?]+$/, 'Establishment key contains unsupported characters');

export const loginRequestSchema = z.object({
  id: staffIdSchema,
  password: passwordSchema,
});

export const registerRequestSchema = z.object({
  account: z.object({
    id: staffIdSchema,
    name: displayNameSchema,
    password: passwordSchema,
  }),
  key: establishmentKeySchema,
});

export const updateEstablishmentKeySchema = z.object({
  key: establishmentKeySchema,
});

export const orderStatusSchema = z.enum(['new', 'cooking', 'ready', 'completed']);

export const updateOrderSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'Order ID is required')
    .max(64, 'Order ID must be 64 characters or fewer'),
  status: orderStatusSchema,
});

export const staffIdParamSchema = z.object({
  id: staffIdSchema,
});

export const orderStatusQuerySchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'Order ID is required')
    .max(64, 'Order ID must be 64 characters or fewer'),
  table: z
    .string()
    .trim()
    .min(1, 'Table number is required')
    .max(16, 'Table number must be 16 characters or fewer'),
});

export const emptyBodySchema = z.object({}).strict();

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type UpdateEstablishmentKeyRequest = z.infer<typeof updateEstablishmentKeySchema>;
export type UpdateOrderRequest = z.infer<typeof updateOrderSchema>;
