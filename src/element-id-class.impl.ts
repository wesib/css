import {
  css__naming,
  NamespaceAliaser,
  NamespaceDef,
  QualifiedName,
} from '@frontmeans/namespace-aliaser';
import { CxEntry, cxSingle } from '@proc7ts/context-values';
import { ComponentContext, DefinitionContext } from '@wesib/wesib';

export type ElementIdClass = QualifiedName;

export const ElementIdClass__NS = /*#__PURE__*/ new NamespaceDef(
  'https://wesib.github.io/ns/element-id-class',
  'elic',
  'element-id-class',
);

export const ElementIdClass: CxEntry<ElementIdClass> = {
  perContext: /*#__PURE__*/ cxSingle({
    byDefault: ElementIdClass$byDefault,
  }),
  toString: () => '[ElementIdClass]',
};

let uniqueClassSeq = 0;

function ElementIdClass$byDefault(target: CxEntry.Target<ElementIdClass>): ElementIdClass {
  const nsAlias = target.get(NamespaceAliaser);
  const context = target.get(ComponentContext);
  const { tagName = 'component' } = context.get(DefinitionContext).elementDef;
  const local = `${tagName}#${++uniqueClassSeq}`;
  const qualified = ElementIdClass__NS.name(nsAlias(ElementIdClass__NS), local, css__naming);
  const element = context.element as Element;

  element.classList.add(qualified);

  return qualified;
}
