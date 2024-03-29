import {
  RefStypRule,
  StypLength,
  StypRule,
  StypRuleList,
  StypRuleRef,
} from '@frontmeans/style-producer';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { cxConstAsset } from '@proc7ts/context-builder';
import { onceAfter } from '@proc7ts/fun-events';
import { Class } from '@proc7ts/primitives';
import { itsEmpty, itsFirst } from '@proc7ts/push-iterator';
import { bootstrapComponents, BootstrapContext, Feature } from '@wesib/wesib';
import { Theme } from './theme';
import { ThemeStyle } from './theme-style';

describe('Theme', () => {
  let theme: Theme;

  describe('ref', () => {
    interface RuleProperties {
      $length: StypLength;
    }

    let ref: StypRuleRef<RuleProperties>;

    beforeEach(async () => {
      await bootstrap();
      ref = theme.ref(RefStypRule.by({ c: 'custom' }, { $length: StypLength.zero }));
    });

    it('obtains CSS rule reference', () => {
      const receiver = jest.fn();

      ref.read.do(onceAfter)(receiver);
      expect(receiver).toHaveBeenCalledWith({ $length: StypLength.zero });
    });
  });

  describe('style', () => {
    it('obtains style when no styles registered', async () => {
      await bootstrap();

      const rules = theme.style(style);

      expect(itsEmpty(rules)).toBe(true);

      const rule = theme.root.rules.add({ $: 'test' }, { $value: 'test' });

      expect([...rules]).toEqual([rule]);

      function style(_theme: Theme): StypRuleList {
        return _theme.root.rules.grab({ $: 'test' });
      }
    });
    it('obtains registered style', async () => {
      @Feature({
        setup(setup) {
          setup.provide(cxConstAsset(ThemeStyle, style));
        },
      })
      class StyleFeature {}

      await bootstrap(StyleFeature);

      const rule: StypRule = itsFirst(theme.style(style))!;
      const receiver = jest.fn();

      rule.read.do(onceAfter)(receiver);
      expect(receiver).toHaveBeenCalledWith({ $value: 'test' });

      function style(_theme: Theme): StypRuleList {
        _theme.root.rules.add({ $: 'test' }, { $value: 'test' });

        return _theme.root.rules.grab({ $: 'test' });
      }
    });
    it('obtains unregistered style', async () => {
      @Feature({
        setup(setup) {
          setup.provide(cxConstAsset(ThemeStyle, style1));
        },
      })
      class StyleFeature {}

      await bootstrap(StyleFeature);

      const rules = theme.style(style2);
      const rule = theme.root.rules.add({ $: 'test2' }, { $value: 'test2' });

      expect([...rules]).toEqual([rule]);

      function style1(_theme: Theme): StypRuleList {
        _theme.root.rules.add({ $: 'test1' }, { $value: 'test1' });

        return _theme.root.rules.grab({ $: 'test1' });
      }

      function style2(_theme: Theme): StypRuleList {
        _theme.root.rules.add({ $: 'test2' }, { $value: 'test2' });

        return _theme.root.rules.grab({ $: 'test2' });
      }
    });
    it('caches style', async () => {
      await bootstrap();

      expect(theme.style(style)).toBe(theme.style(style));

      function style(_theme: Theme): StypRuleList {
        return _theme.root.rules.grab({ $: 'test' });
      }
    });

    describe('combining', () => {
      // eslint-disable-next-line jest/expect-expect
      it('combines registered style and extension', async () => {
        @Feature({
          setup(setup) {
            setup.provide(cxConstAsset(ThemeStyle, style1));
            setup.provide(cxConstAsset(ThemeStyle, { style: style1, provide: style2 }));
          },
        })
        class StyleFeature {}

        await bootstrap(StyleFeature);
        checkCombined();
      });
      // eslint-disable-next-line jest/expect-expect
      it('combines style with extension registered before it', async () => {
        @Feature({
          setup(setup) {
            setup.provide(cxConstAsset(ThemeStyle, { style: style1, provide: style2 }));
            setup.provide(cxConstAsset(ThemeStyle, style1));
          },
        })
        class StyleFeature {}

        await bootstrap(StyleFeature);
        checkCombined();
      });
      // eslint-disable-next-line jest/expect-expect
      it('combines unregistered style and registered extension', async () => {
        @Feature({
          setup(setup) {
            setup.provide(cxConstAsset(ThemeStyle, { style: style1, provide: style2 }));
          },
        })
        class StyleFeature {}

        await bootstrap(StyleFeature);
        checkCombined();
      });

      function style1(_theme: Theme): StypRuleList {
        _theme.root.rules.add({ $: 'test1' }, { $value: 'test1' });

        return _theme.root.rules.grab({ $: 'test1' });
      }

      function style2(_theme: Theme): StypRuleList {
        _theme.root.rules.add({ $: 'test2' }, { $value: 'test2' });

        return _theme.root.rules.grab({ $: 'test2' });
      }

      function checkCombined(): void {
        const rules: StypRule[] = [...theme.style(style1)];

        expect(rules).toHaveLength(2);

        const receiver1 = jest.fn();
        const receiver2 = jest.fn();

        rules[0].read.do(onceAfter)(receiver1);
        expect(receiver1).toHaveBeenCalledWith({ $value: 'test1' });
        rules[1].read.do(onceAfter)(receiver2);
        expect(receiver2).toHaveBeenCalledWith({ $value: 'test2' });
      }
    });
  });

  describe('toString', () => {
    it('provides string representation', () => {
      expect(String(Theme)).toBe('[Theme]');
    });
  });

  async function bootstrap(...features: Class[]): Promise<BootstrapContext> {
    @Feature({
      init(context) {
        theme = context.get(Theme);
      },
    })
    class TestFeature {}

    return bootstrapComponents(TestFeature, ...features).whenReady;
  }
});
