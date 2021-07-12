import { doqryPicker, DoqryPicker, DoqryPurePicker, DoqryPureSelector, DoqrySubPicker } from '@frontmeans/doqry';
import { NamespaceAliaser } from '@frontmeans/namespace-aliaser';
import { RenderScheduler } from '@frontmeans/render-scheduler';
import {
  lazyStypRules,
  StypFormat,
  StypFormatConfig,
  stypObjectFormat,
  StypObjectFormatConfig,
  StypRenderer,
  StypRules,
} from '@frontmeans/style-producer';
import { CxEntry, cxSingle } from '@proc7ts/context-values';
import { elementOrArray, extendSetOfElements, setOfElements, valueProvider } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { ComponentContext, ShadowContentRoot } from '@wesib/wesib';
import { ComponentStyleProducer } from './component-style-producer';
import { componentStypDomFormatConfig } from './component-styp-dom.format-config';
import { ComponentStypRenderer } from './component-styp-renderer';
import { ElementIdClass } from './element-id-class.impl';

/**
 * Configuration of {@link ComponentStypFormat component style production format}.
 *
 * Depends on [@frontmeans/style-producer].
 *
 * [@frontmeans/style-producer]: https://www.npmjs.com/package/@frontmeans/style-producer
 */
export interface ComponentStypFormatConfig extends StypFormatConfig {

  /**
   * Structured CSS selector to use for custom element's host.
   *
   * It modifies the selectors of produced CSS rules.
   *
   * For custom element with shadow root:
   * - Replaces root CSS rule selector with `:host(<hostSelector>).
   * - When `hostSelector` is omitted, then replaces root CSS rule selector with `:host`.
   * - If CSS rule selector starts with `:host`, then replaces `:host` with `:host(<hostSelector>)`
   * - If CSS rule selector starts with `:host(<selector>)`, then extends `<selector>` by `hostSelector`.
   *   I.e. appends CSS classes and sub-selectors to it, and fulfills missing element and identifier selectors.
   *
   * For custom element without shadow root either uses provided `hostSelector`, or generates a unique one when omitted.
   * And additionally:
   * - Replaces root CSS rule selector it with `hostSelector`.
   * - If CSS rule selector starts with `:host`, then replaces `:host` with `hostSelector`.
   * - If CSS rule selector starts with `:host(<selector>), then replaces `:host(<selector>)` with `<selector>` extended
   *   by `hostSelector`. I.e. appends CSS classes and sub-selectors to it, and fulfills missing element and identifier
   *   selectors.
   * - Otherwise prepends CSS rule selector with `hostSelector`.
   *
   * This selector should not contain a `:host` sub-selector.
   */
  readonly hostSelector?: DoqryPureSelector.Part | string;

  /**
   * Root CSS selector is never used for custom elements. A `hostSelector` is applied instead.
   */
  readonly rootSelector?: undefined;

  /**
   * DOM rendering operations scheduler.
   *
   * Creates a render schedule per rule.
   *
   * `ElementRenderScheduler` is used when omitted.
   */
  readonly scheduler?: RenderScheduler;

  /**
   * Namespace aliaser to use.
   *
   * Default `NamespaceAliaser` used when omitted.
   */
  readonly nsAlias?: NamespaceAliaser;

}

const ComponentStypFormat$perContext: CxEntry.Definer<ComponentStypFormat> = (/*#__PURE__*/ cxSingle({
  byDefault(context) {
    return new ComponentStypObjectFormat(context.get(ComponentContext));
  },
}));

/**
 * Component style production format.
 *
 * This format can be obtained from component context.
 *
 * The formats implemented:
 * - {@link ComponentStypObjectFormat} (the default) renders CSS using CSS object model.
 * - {@link ComponentStypDomFormat} renders CSS as text. May render CSS of disconnected element.
 */
export abstract class ComponentStypFormat {

  static perContext(target: CxEntry.Target<ComponentStypFormat>): CxEntry.Definition<ComponentStypFormat> {
    return ComponentStypFormat$perContext(target);
  }

  static toString(): string {
    return '[ComponentStypFormat]';
  }

  /**
   * Component context.
   */
  abstract readonly context: ComponentContext;

  /**
   * Produces and dynamically updates component's CSS stylesheets based on the given CSS rules.
   *
   * Utilizes {@link newProducer component's producer function}.
   *
   * @param rules - A source of CSS rules to produce stylesheets for.
   * @param config - Style production format configuration.
   *
   * @returns CSS rules supply. Once cut off the produced stylesheets are removed.
   */
  produce(
      rules: StypRules.Source,
      config?: ComponentStypFormatConfig,
  ): Supply {

    const producer = this.newProducer(rules, config);
    const supply = new Supply();

    this.context.whenSettled(() => producer().as(supply));

    return supply;
  }

  /**
   * Creates component's CSS stylesheets producer based on the given CSS rules.
   *
   * Utilizes {@link ComponentStyleProducer}.
   *
   * @param rules - A source of CSS rules to produce stylesheets for.
   * @param config - Style production format configuration.
   *
   * @returns CSS rules producer function returning CSS rules supply. Once cut off the produced stylesheets are removed.
   */
  newProducer(
      rules: StypRules.Source,
      config?: ComponentStypFormatConfig,
  ): (this: void) => Supply {

    const css = lazyStypRules(rules);
    let producer: () => Supply;
    const componentSupply = this.context.supply;

    producer = () => {

      const produceStyle = this.context.get(ComponentStyleProducer);

      return produceStyle(css, this.format(config)).needs(componentSupply);
    };

    // In case the component destroyed already, the producer will be reassigned here _before_ return.
    componentSupply.whenOff(() => {
      // Prevent style production once component destroyed.
      producer = valueProvider(componentSupply);
    });

    return () => producer();
  }

  /**
   * Builds CSS style production format to by its config.
   *
   * This method is called by {@link produce} one.
   *
   * @param config - Component style production format configuration.
   *
   * @returns Component style production format.
   */
  abstract format(config?: ComponentStypFormatConfig): StypFormat;

  /**
   * Builds component-specific style renderer.
   *
   * This renderer applies {@link ComponentStypFormatConfig.hostSelector host selector} to generated CSS rules.
   *
   * This method is called by {@link format} one.
   *
   * @param config - Component style production format configuration.
   *
   * @returns Component style renderer(s).
   */
  renderer(
      config: ComponentStypFormatConfig,
  ): StypRenderer | readonly StypRenderer[] | undefined {

    const shadowRoot = this.context.get(ShadowContentRoot, { or: null });
    const { renderer } = config;
    const renderers = extendSetOfElements(
        setOfElements<StypRenderer>(renderer),
        this.context.get(ComponentStypRenderer),
    );

    const hostSelector = config.hostSelector
        ? doqryPicker(config.hostSelector)[0] as DoqryPurePicker.Part
        : undefined;

    renderers.add(shadowRoot
        ? shadowRenderer(hostSelector)
        : noShadowRenderer(hostSelector || { c: [this.context.get(ElementIdClass)] }));

    return elementOrArray(renderers);
  }

}


function shadowRenderer(hostSelector: DoqryPurePicker.Part | undefined): StypRenderer {
  return {
    order: -100,
    render(producer, properties) {

      let { selector } = producer;

      if (!selector.length) {
        selector = [hostSelector || { u: [[':', 'host']] }];
      } else if (hostSelector) {

        const [rest, host] = extractHostSelector(selector);

        if (host) {
          if (host.length) {
            selector = [{ u: [[':', 'host', extendHostSelector(host, hostSelector)]] }, ...rest];
          } else {
            selector = [{ u: [[':', 'host', [hostSelector]]] }, ...rest];
          }
        }
      }

      producer.render(properties, { selector });
    },
  };
}

function noShadowRenderer(hostSelector: DoqryPurePicker.Part): StypRenderer {
  return {
    order: -100,
    render(producer, properties) {

      let { selector } = producer;

      if (!selector.length) {
        selector = [hostSelector];
      } else {

        const [rest, host] = extractHostSelector(selector);

        if (host && host.length) {
          selector = [...extendHostSelector(host, hostSelector), ...rest];
        } else {
          selector = [hostSelector, ...rest];
        }
      }

      producer.render(properties, { selector });
    },
  };
}

function extractHostSelector(
    selector: DoqryPicker,
): [DoqryPicker, DoqryPicker?] {
  if (typeof selector[0] !== 'string') {

    const [{ ns, e, i, c, u, s, $ }, ...restParts] = selector;

    if (!ns && !e && !i && !c && !s && u) {

      const [[prefix, name, ...params]] = u;

      if (prefix === ':' && name === 'host') {

        let host: DoqryPicker.Mutable;

        if (params.length) {
          host = (params[0] as DoqrySubPicker.Parameter).slice();
          (host[0] as { $?: string | readonly string[] }).$ = $;
        } else {
          host = $ ? [{ $ }] : [];
        }

        return [restParts, host];
      }
    }
  }
  return [selector];
}

function extendHostSelector(
    selector: DoqryPicker,
    {
      ns,
      e,
      i,
      c,
      u,
      s,
    }: DoqryPurePicker.Part,
): DoqryPicker {

  const [first, ...rest] = selector as [DoqryPicker.Part, ...DoqryPicker];

  return [
    {
      ns: first.e || first.ns ? first.ns : ns,
      e: first.e || first.ns ? first.e : e,
      i: first.i || i,
      c: first.c ? (c ? [...first.c, ...c] : first.c) as typeof c : c,
      u: first.u ? (u ? [...first.u, ...u] : first.u) as typeof u : u,
      s: ((first.s || '') + (s || '')) || undefined,
      $: first.$,
    },
    ...rest,
  ];
}

/**
 * Component's CSS object model production format.
 *
 * Renders CSS when component's element connected to document.
 *
 * This format is used by default.
 */
export class ComponentStypObjectFormat extends ComponentStypFormat {

  /**
   * Constructs CSS object model production format.
   *
   * @param context - Target component context.
   */
  constructor(readonly context: ComponentContext) {
    super();
  }

  format(config?: ComponentStypFormatConfig & StypObjectFormatConfig): StypFormat {
    return stypObjectFormat(this.config(config));
  }

  /**
   * Builds configuration of CSS object model production format.
   *
   * This method is called by {@link format} one.
   *
   * @param config - Original component style production format configuration.
   *
   * @returns Configuration of CSS object model production format.
   */
  config(config?: ComponentStypFormatConfig & StypObjectFormatConfig): StypObjectFormatConfig {
    return componentStypDomFormatConfig(this, config, { when: 'connected' });
  }

}
