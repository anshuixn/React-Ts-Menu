import { describe, expect, it } from 'vitest';
import {
  loginRequestSchema,
  orderStatusQuerySchema,
  registerRequestSchema,
  updateOrderSchema,
  updateEstablishmentKeySchema,
} from "./validation.js";

describe('validation schemas', () => {
  it('accepts a valid login payload', () => {
    expect(
      loginRequestSchema.safeParse({
        id: 'CHEF_RAJAN',
        password: 'securepass123',
      }).success,
    ).toBe(true);
  });

  it('rejects a short password during registration', () => {
    const result = registerRequestSchema.safeParse({
      account: {
        id: 'CHEF_RAJAN',
        name: 'Chef Rajan',
        password: 'short',
      },
      key: 'very-secure-key',
    });

    expect(result.success).toBe(false);
  });

  it('rejects unsupported establishment key characters', () => {
    const result = updateEstablishmentKeySchema.safeParse({
      key: 'invalid key with spaces',
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid order update payloads', () => {
    expect(
      updateOrderSchema.safeParse({
        id: 'ORD-123',
        status: 'ready',
      }).success,
    ).toBe(true);
  });

  it('requires order id, table, and tracking token for public status lookups', () => {
    expect(
      orderStatusQuerySchema.safeParse({
        id: 'ORD-123',
        table: '12',
        token: 'tracking-token-123',
      }).success,
    ).toBe(true);

    expect(
      orderStatusQuerySchema.safeParse({
        id: 'ORD-123',
        table: '12',
      }).success,
    ).toBe(false);
  });
});
