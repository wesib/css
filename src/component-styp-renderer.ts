import { StypRenderer } from '@frontmeans/style-producer';
import { cxArray, CxEntry } from '@proc7ts/context-values';

/**
 * A CSS renderer that will be enabled by default by {@link ComponentStypFormat component style production format}.
 */
export type ComponentStypRenderer = StypRenderer;

/**
 * Component context entry containing component CSS renderers.
 */
export const ComponentStypRenderer: CxEntry<
  readonly ComponentStypRenderer[],
  ComponentStypRenderer
> = {
  perContext: /*#__PURE__*/ cxArray(),
  toString: () => '[ComponentStypRenderer]',
};
