import { validate, version } from 'uuid';
import { describe, expect, it } from 'vitest';

import { createUuidV7 } from '../src/shared/uuid.js';

describe('createUuidV7', () => {
  it('creates a valid UUID version 7', () => {
    const id = createUuidV7();

    expect(validate(id)).toBe(true);
    expect(version(id)).toBe(7);
  });
});
