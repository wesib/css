import { describe, expect, it } from '@jest/globals';
import { ElementIdClass } from './element-id-class.impl';

describe('ElementIdClass', () => {
  describe('toString', () => {
    it('provides string representation', () => {
      expect(String(ElementIdClass)).toBe('[ElementIdClass]');
    });
  });
});
