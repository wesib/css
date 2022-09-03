import { produceBasicStyle, StypFormat, StypRules } from '@frontmeans/style-producer';
import { cxDefaultScoped, CxEntry, cxSingle } from '@proc7ts/context-values';
import { Supply } from '@proc7ts/supply';
import { BootstrapContext } from '@wesib/wesib';

/**
 * Component style producer signature.
 */
export type ComponentStyleProducer =
  /**
   * @param rules - CSS rules to produce stylesheets for. This can be e.g. a `StypRule.rules` to render all rules,
   * or a result of `StypRuleList.grab()` method call to render only matching ones.
   * @param format - Style production format.
   *
   * @returns Styles supply. Once cut off (i.e. its `off()` method is called) the produced stylesheets are removed.
   */
  (this: void, rules: StypRules, format: StypFormat) => Supply;

/**
 * Bootstrap, definition, or component context entry containing a component style producer.
 *
 * Utilizes `produceBasicStyle()` by default. I.e. it does not enable default renderers. To enable them all a
 * {@link StyleProducerSupport} can be used.
 *
 * Depends on [@frontmeans/style-producer].
 *
 * [@frontmeans/style-producer]: https://www.npmjs.com/package/@frontmeans/style-producer
 */
export const ComponentStyleProducer: CxEntry<ComponentStyleProducer> = {
  perContext: /*#__PURE__*/ cxDefaultScoped(
    BootstrapContext,
    /*#__PURE__*/ cxSingle({
      byDefault: _target => produceBasicStyle,
    }),
  ),
  toString: () => '[ComponentStyleProducer]',
};
