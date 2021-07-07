import { describe, expect, it } from '@jest/globals';
import { CxBuilder, cxConstAsset } from '@proc7ts/context-builder';
import { BootstrapContext } from '@wesib/wesib';
import { ThemeStyle } from './theme-style';

describe('ThemeStyle', () => {
  it('falls back when absent', () => {

    const cxBuilder = new CxBuilder(get => ({ get }));

    cxBuilder.provide(cxConstAsset(BootstrapContext, cxBuilder.context as any));

    expect(cxBuilder.get(ThemeStyle, { or: null })).toBeNull();
  });

  describe('toString', () => {
    it('provides string representation', () => {
      expect(String(ThemeStyle)).toBe('[ThemeStyle]');
    });
  });
});
