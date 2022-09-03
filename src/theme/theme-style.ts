import { stypRules, StypRules } from '@frontmeans/style-producer';
import { cxDefaultScoped, cxDynamic, CxEntry } from '@proc7ts/context-values';
import { asis } from '@proc7ts/primitives';
import { BootstrapContext } from '@wesib/wesib';
import { Theme } from './theme';

/**
 * Theme style provides part of the theme styling information.
 *
 * Theme style(s) can be provided in bootstrap context. They are applied to the theme at most once, when requested
 * by calling {@link Theme.style} method.
 *
 * Theme style is either a function, or an extension of another theme style.
 */
export type ThemeStyle = ThemeStyle.Provider | ThemeStyle.Extension;

export namespace ThemeStyle {
  /**
   * Theme style provider function.
   *
   * This function is called at most once per theme to apply styles to the latter. E.g. by declaring CSS rules.
   *
   * This function is used as an identifier of particular style and can be extended using {@link ThemeStyle.Extension}.
   *
   * It is not absolutely necessary to register style provider. It will be applied on request anyway.
   *
   * @param theme - A theme to apply styling to.
   *
   * @returns Dynamically updated CSS rule set containing the applied styling.
   */
  export type Provider = (this: void, theme: Theme) => StypRules;

  /**
   * Theme style extension.
   *
   * An extension should be registered in bootstrap context in order to be applied.
   */
  export interface Extension {
    /**
     * A theme style provider to extend.
     */
    readonly style: ThemeStyle.Provider;

    /**
     * Extends the theme style.
     *
     * This method is called at most once per theme to apply styles to the latter. E.g. by declaring CSS rules.
     *
     * It will be called after the style provider it extends.
     *
     * @param theme - A theme to apply styling to.
     *
     * @returns Dynamically updated CSS rule set containing the applied styling.
     */
    provide(theme: Theme): StypRules;
  }

  /**
   * A function obtaining combined style provider. I.e. the one that applies the style along with all extensions.
   *
   * @param A - provider of theme style to apply.
   *
   * @returns A combined theme style provider.
   */
  export type ById = (this: void, style: ThemeStyle.Provider) => ThemeStyle.Provider;
}

/**
 * Context entry containing theme styles.
 */
export const ThemeStyle: CxEntry<ThemeStyle.ById, ThemeStyle> = {
  perContext: /*#__PURE__*/ cxDefaultScoped(
    BootstrapContext,
    /*#__PURE__*/ cxDynamic<ThemeStyle.ById, ThemeStyle, ThemeStyle.ById>({
      create: ThemeStyle$create,
      byDefault: _target => asis,
      assign: ({ get, to }, _target) => {
        const byId: ThemeStyle.ById = id => get()(id);

        return receiver => to((_, by) => receiver(byId, by));
      },
    }),
  ),
  toString: () => '[ThemeStyle]',
};

function ThemeStyle$create(
  styles: ThemeStyle[],
  _target: CxEntry.Target<ThemeStyle.ById, ThemeStyle>,
): ThemeStyle.ById {
  const providers = new Map<ThemeStyle.Provider, [ThemeStyle.Provider, boolean]>();

  for (const style of styles) {
    let key: ThemeStyle.Provider;
    let provider: ThemeStyle.Provider;
    let isId: boolean;

    if (typeof style === 'function') {
      key = provider = style;
      isId = true;
    } else {
      key = style.style;
      provider = style.provide.bind(style);
      isId = false;
    }

    const prev = providers.get(key);

    if (!prev) {
      providers.set(key, [provider, isId]);
    } else {
      const [prevProvider, hasId] = prev;

      providers.set(key, [
        isId
          ? ThemeStyle$combine(provider, prevProvider)
          : ThemeStyle$combine(prevProvider, provider),
        isId || hasId,
      ]);
    }
  }

  return byId;

  function byId(id: ThemeStyle.Provider): ThemeStyle.Provider {
    const existing = providers.get(id);

    if (!existing) {
      return id;
    }

    const [provider, hasId] = existing;

    return hasId ? provider : ThemeStyle$combine(id, provider);
  }
}

function ThemeStyle$combine(
  first: ThemeStyle.Provider,
  second: ThemeStyle.Provider,
): ThemeStyle.Provider {
  return theme => stypRules(first(theme), second(theme));
}
