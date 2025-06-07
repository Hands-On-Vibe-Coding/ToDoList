import { describe, it, expect } from 'vitest';
import { placeholder } from './index';

describe('backend placeholder', () => {
  it('should have placeholder text', () => {
    expect(placeholder).toBe('Backend will be implemented in Phase 2');
  });
});
