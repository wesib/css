import { nodeDocument } from '@frontmeans/dom-primitives';
import { NamespaceAliaser } from '@frontmeans/namespace-aliaser';
import { StypDomFormatConfig } from '@frontmeans/style-producer';
import { ComponentContext, ComponentRenderScheduler, RenderDef } from '@wesib/wesib';
import { ComponentStypFormat, ComponentStypFormatConfig } from './component-styp-format';

/**
 * Builds configuration of DOM style production format.
 *
 * Schedules style rendering in `ComponentRenderScheduler` by default.
 *
 * Utilizes `NamespaceAliaser` by default.
 *
 * @param format - Target component style production format.
 * @param config - Original component style production format configuration.
 * @param render - Element render definition to apply to style render schedule, unless render scheduler specified
 * explicitly in `config`.
 *
 * @returns Configuration of DOM style production format.
 */
export function componentStypDomFormatConfig(
  format: ComponentStypFormat,
  config: ComponentStypFormatConfig & StypDomFormatConfig = {},
  render?: RenderDef,
): StypDomFormatConfig {
  const { context } = format;

  return {
    ...config,
    document: config.document || nodeDocument(context.element as Node),
    parent: config.parent || context.contentRoot,
    rootSelector: [],
    scheduler: config.scheduler || defaultStypRenderScheduler(context, render),
    nsAlias: config.nsAlias || context.get(NamespaceAliaser),
    renderer: format.renderer(config),
  };
}

/**
 * @internal
 */
function defaultStypRenderScheduler(
  context: ComponentContext,
  render: RenderDef = {},
): ComponentRenderScheduler {
  const scheduler = context.get(ComponentRenderScheduler);

  return (opts = {}) => scheduler({ ...opts, ...render });
}
