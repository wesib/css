import { immediateRenderScheduler } from '@frontmeans/render-scheduler';
import { StypProperties, StypRenderer, stypRoot, StypRules, stypSelectorText } from '@frontmeans/style-producer';
import { trackValue } from '@proc7ts/fun-events';
import {
  Component,
  ComponentContext,
  ComponentDef,
  DefaultRenderScheduler,
  Feature,
  ShadowContentRoot,
} from '@wesib/wesib';
import { testDefinition } from '@wesib/wesib/testing';
import { ComponentStypDomFormat } from './component-styp-dom.format';
import { ComponentStypFormat, ComponentStypFormatConfig } from './component-styp-format';
import { ComponentStypRenderer } from './component-styp-renderer';
import { ElementIdClass } from './element-id-class.impl';
import { ProduceStyle } from './produce-style.amendment';
import { StyleProducerSupport } from './style-producer-support.feature';

describe('@ProduceStyle', () => {

  let element: HTMLElement;

  beforeEach(() => {
    element = document.body.appendChild(document.createElement('test-component'));
  });
  afterEach(() => {
    element.remove();
  });

  it('renders style', async () => {
    await mount();
    expect(cssStyle().display).toBe('block');
  });
  it('renders styles', async () => {
    await mount(stypRoot({ display: 'block' }).rules);
    expect(cssStyle().display).toBe('block');
  });
  it('renders styles with StyleProducerSupport', async () => {
    await mount(stypRoot({ display: 'block' }).rules, { feature: { needs: StyleProducerSupport } });
    expect(cssStyle().display).toBe('block');
  });
  it('renders styles generated by function', async () => {
    await mount(() => stypRoot({ display: 'block' }).rules);
    expect(cssStyle().display).toBe('block');
  });
  it('renders styles using component CSS renderer', async () => {

    const mockRenderer = jest.fn<void, Parameters<StypRenderer.Function>>(
        (producer, properties) => producer.render(properties),
    );

    await mount(
        undefined,
        {
          setup(setup) {
            setup.perComponent({ a: ComponentStypRenderer, is: mockRenderer });
          },
        },
    );
    expect(cssStyle().display).toBe('block');
    expect(mockRenderer).toHaveBeenCalledWith(expect.anything(), { display: 'block' });
  });
  it('renders styles using DOM format', async () => {

    let produceSpy!: jest.SpyInstance;

    await mount(
        stypRoot({ display: 'block' }).rules,
        {
          setup(setup) {
            setup.perComponent({
              a: ComponentStypFormat,
              by(context: ComponentContext) {

                const format = new ComponentStypDomFormat(context);

                produceSpy = jest.spyOn(format, 'produce');

                return format;
              },
            });
          },
        },
    );

    expect(produceSpy).toHaveBeenCalled();
    expect(cssStyle().display).toBe('block');
  });
  it('(when: connected) renders styles using DOM format', async () => {

    let produceSpy!: jest.SpyInstance;

    await mount(
        stypRoot({ display: 'block' }).rules,
        {
          setup(setup) {
            setup.perComponent({
              a: ComponentStypFormat,
              by(context: ComponentContext) {

                const format = new ComponentStypDomFormat(context, { when: 'connected' });

                produceSpy = jest.spyOn(format, 'produce');

                return format;
              },
            });
          },
        },
    );

    expect(produceSpy).toHaveBeenCalled();
    expect(cssStyle().display).toBe('block');
  });
  it('does not remove styles on component disposal', async () => {

    const context = await mount(
        () => stypRoot({ display: 'block' }).rules,
        {
          name: 'text-component',
          setup(setup) {
            setup.perComponent({ a: ComponentStypFormat, as: ComponentStypDomFormat });
          },
        },
    );

    context.supply.off();
    expect(element.querySelector('style')!.textContent).toContain(
        '{\n'
        + '  display: block;\n'
        + '}',
    );
  });
  it('updates style', async () => {

    const css = trackValue<StypProperties>({ display: 'block' });

    await mount(stypRoot(css));

    css.it = { display: 'inline-block' };
    expect(cssStyle().display).toBe('inline-block');
  });
  it('prepends element id class to CSS rule selector', async () => {

    const context = await mount();
    const rule = cssStyleRule();
    const idClass = context.get(ElementIdClass);

    expect(rule.selectorText).toBe(stypSelectorText({ c: idClass }));
  });
  it('prepends element id class to CSS rule selector of anonymous component', async () => {

    const context = await mount(undefined, {});
    const rule = cssStyleRule();
    const idClass = context.get(ElementIdClass);
    const selector = stypSelectorText({ c: idClass });

    expect(rule.selectorText).toBe(selector);
    expect(selector).toMatch(/^\.component\\#\d+\\@/);
  });
  it('prepends `:host` CSS rule selector when shadow DOM supported', async () => {
    await mount(undefined, {
      setup(setup) {
        setup.perComponent({
          a: ShadowContentRoot,
          by(ctx: ComponentContext) {
            return ctx.element;
          },
        });
      },
    });

    const rule = cssStyleRule();

    expect(rule.selectorText).toBe(':host');
  });

  async function mount(
      rules: StypRules.Source = stypRoot({ display: 'block' }),
      def: ComponentDef = { name: 'test-component' },
      config?: ComponentStypFormatConfig,
  ): Promise<ComponentContext> {

    @Component(def)
    @Feature({
      setup(setup) {
        setup.provide({
          a: DefaultRenderScheduler,
          is: immediateRenderScheduler,
        });
      },
    })
    class TestComponent {

      @ProduceStyle(config)
      get style(): StypRules.Source {
        return rules;
      }

    }

    const defContext = await testDefinition(TestComponent);

    return defContext.mountTo(element);
  }

  function cssStyle(): CSSStyleDeclaration {
    return cssStyleRule().style;
  }

  function cssStyleRule(): CSSStyleRule {

    const styles = element.querySelectorAll('style');

    expect(styles).toHaveLength(1);

    const style = styles[0];
    const sheet = style.sheet as CSSStyleSheet;
    const rule = sheet.cssRules[0] as CSSStyleRule;

    expect(rule).toBeDefined();

    return rule;
  }
});
