import {
  lazyStypRules,
  RefStypRule,
  StypProperties,
  stypRoot,
  StypRule,
  StypRuleRef,
  StypRules,
} from '@frontmeans/style-producer';
import { cxDefaultScoped, CxEntry, cxSingle } from '@proc7ts/context-values';
import { BootstrapContext } from '@wesib/wesib';
import { ThemeStyle } from './theme-style';

export interface ThemeFactory {

  newTheme(): Theme;

}

const Theme$perContext: CxEntry.Definer<Theme> = (/*#__PURE__*/ cxDefaultScoped(
    BootstrapContext,
    (/*#__PURE__*/ cxSingle({
      byDefault: target => new Theme$(target.get(ThemeStyle)),
    })),
));

/**
 * A hierarchy of CSS rules within single root.
 *
 * A component may use it to extract styling information.
 *
 * Current theme is available in bootstrap, definition, or component context. By default, only one theme is declared
 * per bootstrap. But this can be overridden.
 */
export abstract class Theme {

  static perContext(target: CxEntry.Target<Theme>): CxEntry.Definition<Theme> {
    return Theme$perContext(target);
  }

  static toString(): string {
    return '[Theme]';
  }

  /**
   * Root CSS rule.
   *
   * All theme styling is represented as rules within this root.
   */
  abstract readonly root: StypRule;

  /**
   * Obtains CSS rule reference by its `referrer`.
   *
   * This is a helper method that resolves the given `referrer` against the `root` CSS rule of this theme.
   *
   * @param referrer - Target CSS rule referrer.
   *
   * @returns CSS rule reference.
   */
  ref<T extends StypProperties<T>>(referrer: RefStypRule<T>): StypRuleRef<T> {
    return referrer(this.root);
  }

  /**
   * Obtains a styling for the given theme styles.
   *
   * This method requests the registered {@link ThemeStyle theme styles} for CSS rules they provide.
   * If some of the styles are not registered then uses the given style as provider.
   *
   * @param styles - The styles to obtain styling information for.
   *
   * @returns Dynamically updated CSS rule set containing the requested styling.
   */
  abstract style(...styles: ThemeStyle.Provider[]): StypRules;

}

/**
 * @internal
 */
class Theme$ extends Theme {

  readonly root: StypRule = stypRoot();
  private readonly _rules = new Map<ThemeStyle.Provider, StypRules>();

  constructor(private readonly _styles: ThemeStyle.ById) {
    super();
  }

  style(...styles: ThemeStyle.Provider[]): StypRules {

    const theme = this;

    return lazyStypRules(...styles.reduce<StypRules[]>(addStyleRules, []));

    function addStyleRules(target: StypRules[], style: ThemeStyle.Provider): StypRules[] {

      const existing = theme._rules.get(style);

      if (existing) {
        target.push(existing);
      } else {

        const constructed = theme._styles(style)(theme);

        theme._rules.set(style, constructed);
        target.push(constructed);
      }

      return target;
    }
  }

}
