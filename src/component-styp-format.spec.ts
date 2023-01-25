import { nodeDocument } from '@frontmeans/dom-primitives';
import { doqryPicker, DoqryPicker, DoqrySelector } from '@frontmeans/doqry';
import { NamespaceAliaser, newNamespaceAliaser } from '@frontmeans/namespace-aliaser';
import {
  immediateRenderScheduler,
  newManualRenderScheduler,
  RenderScheduler,
} from '@frontmeans/render-scheduler';
import {
  produceBasicStyle,
  StypFormatConfig,
  StypRenderer,
  stypRoot,
} from '@frontmeans/style-producer';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CxBuilder, cxConstAsset } from '@proc7ts/context-builder';
import { CxGlobals } from '@proc7ts/context-values';
import { trackValue } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/supply';
import {
  BootstrapContext,
  ComponentContext,
  ComponentRenderScheduler,
  ComponentState,
  ShadowContentRoot,
} from '@wesib/wesib';
import { Mock } from 'jest-mock';
import { ComponentStyleProducer } from './component-style-producer';
import { ComponentStypDomFormat } from './component-styp-dom.format';
import { ComponentStypFormat, ComponentStypFormatConfig } from './component-styp-format';
import { ElementIdClass, ElementIdClass__NS } from './element-id-class.impl';

describe('ComponentStypDomFormat', () => {
  let done: Supply;

  beforeEach(() => {
    done = new Supply();
  });
  afterEach(() => {
    done.off();
  });

  let cxBuilder: CxBuilder<ComponentContext>;
  let context: ComponentContext;

  beforeEach(() => {
    const ready = trackValue<ComponentContext>();

    cxBuilder = new CxBuilder(
      (get, { supply }) => ({
          element: document.createElement('test-element'),
          supply,
          whenReady: ready.read,
          whenSettled: ready.read,
          settled: true,
          get,
          contentRoot: document.createElement('content-root'),
        } as Partial<ComponentContext> as ComponentContext),
    );

    ready.it = context = cxBuilder.context;

    cxBuilder.provide(cxConstAsset(CxGlobals, context));
    cxBuilder.provide(cxConstAsset(ComponentContext, context));
    cxBuilder.provide(cxConstAsset(BootstrapContext, context as any));
  });

  beforeEach(() => {
    cxBuilder.provide(cxConstAsset(ComponentState, new ComponentState()));
  });

  let mockRenderScheduler: Mock<RenderScheduler>;

  beforeEach(() => {
    mockRenderScheduler = jest.fn(immediateRenderScheduler);
    cxBuilder.provide(cxConstAsset(ComponentRenderScheduler, mockRenderScheduler));
  });

  let elementId: ElementIdClass;

  beforeEach(() => {
    elementId = ['test-element-id', ElementIdClass__NS];
    cxBuilder.provide(cxConstAsset(ElementIdClass, elementId));
  });

  let mockRenderer: Mock<StypRenderer.Function>;
  let renderedSelector: DoqryPicker;

  beforeEach(() => {
    renderedSelector = undefined!;
    mockRenderer = jest.fn((prod, _props) => {
      renderedSelector = prod.selector;
    });
  });

  let mockProduceStyle: Mock<typeof produceBasicStyle>;

  beforeEach(() => {
    mockProduceStyle = jest.fn(produceBasicStyle);
    cxBuilder.provide(cxConstAsset(ComponentStyleProducer, mockProduceStyle));
  });

  let format: ComponentStypDomFormat;

  beforeEach(() => {
    format = new ComponentStypDomFormat(context);
  });

  describe('config', () => {
    describe('document', () => {
      it('defaults to component document', () => {
        expect(format.config().document).toBe(nodeDocument(context.element as Node));
      });
      it('respects explicit value', () => {
        const doc = document.implementation.createHTMLDocument('test');

        expect(format.config({ document: doc }).document).toBe(doc);
      });
    });

    describe('parent', () => {
      it('defaults to component content root', () => {
        expect(format.config().parent).toBe(context.contentRoot);
      });
      it('respects explicit value', () => {
        const parent = document.createElement('content-parent');

        expect(format.config({ parent }).parent).toBe(parent);
      });
    });

    describe('rootSelector', () => {
      it('is empty by default', () => {
        expect(format.config()).toMatchObject({ rootSelector: [] });
      });
      it('ignores explicit value', () => {
        expect(
          format.config({
            rootSelector: 'some',
          } as StypFormatConfig as ComponentStypFormatConfig),
        ).toMatchObject({
          rootSelector: [],
        });
      });
    });

    describe('scheduler', () => {
      it('defaults to render scheduler', () => {
        produce();
        expect(mockProduceStyle).toHaveBeenCalled();

        const scheduler = mockProduceStyle.mock.calls[0][1]!.scheduler!;
        const config = { window, name: 'options' };

        scheduler(config);

        expect(mockRenderScheduler).toHaveBeenCalled();
      });
      it('respects explicit value', () => {
        const scheduler = newManualRenderScheduler();

        expect(format.config({ scheduler })).toMatchObject({ scheduler });
      });
    });

    describe('nsAlias', () => {
      it('defaults to default namespace alias', () => {
        expect(format.config()).toMatchObject({ nsAlias: context.get(NamespaceAliaser) });
      });
      it('respects explicit value', () => {
        const nsAlias = newNamespaceAliaser();

        expect(format.config({ nsAlias })).toMatchObject({ nsAlias });
      });
    });

    describe('renderer', () => {
      it('respects explicit value', () => {
        produce();
        expect(mockRenderer).toHaveBeenCalled();
      });
    });

    function produce(config: ComponentStypFormatConfig = {}): void {
      format
        .produce(stypRoot({ font: 'serif' }).rules, {
          ...config,
          renderer: mockRenderer,
        })
        .needs(done);
    }
  });

  describe('toString', () => {
    it('provides string representation', () => {
      expect(String(ComponentStypFormat)).toBe('[ComponentStypFormat]');
    });
  });

  describe('selector modification', () => {
    describe('with shadow DOM', () => {
      beforeEach(() => {
        const contentRoot = context.contentRoot as Element;
        const shadowRoot = contentRoot.attachShadow({ mode: 'closed' });

        cxBuilder.provide(cxConstAsset(ShadowContentRoot, shadowRoot));
      });

      it('replaces root selector with `:host` by default', () => {
        produce([]);
        expect(renderedSelector).toEqual([{ u: [[':', 'host']] }]);
      });
      it('retains arbitrary selector by default', () => {
        produce([{ e: 'test-element' }]);
        expect(renderedSelector).toEqual([{ e: 'test-element' }]);
      });
      it('retains arbitrary selector when host selector specified', () => {
        produce([{ e: 'test-element' }], { hostSelector: { c: 'host-class' } });
        expect(renderedSelector).toEqual([{ e: 'test-element' }]);
      });
      it('replaces `:host` selector with host one', () => {
        produce([{ u: [':', 'host'] }, { e: 'nested-element' }], {
          hostSelector: { c: 'host-class' },
        });
        expect(renderedSelector).toEqual([
          { u: [[':', 'host', [{ c: ['host-class'] }]]] },
          { e: 'nested-element' },
        ]);
      });
      it('extends `:host(selector)` selector with host one', () => {
        produce([{ u: [':', 'host', { c: 'test-class' }] }, { e: 'nested-element' }], {
          hostSelector: { c: 'host-class' },
        });
        expect(renderedSelector).toEqual([
          { u: [[':', 'host', [{ c: ['test-class', 'host-class'] }]]] },
          { e: 'nested-element' },
        ]);
      });
    });

    describe('without shadow DOM', () => {
      it('replaces root selector with ID class by default', () => {
        produce([]);
        expect(renderedSelector).toEqual([{ c: [elementId] }]);
      });
      it('replaces root selector with normalized explicit host selector', () => {
        const hostSelector = { e: 'host-element', c: 'some' };

        produce([], { hostSelector });
        expect(renderedSelector).toEqual(doqryPicker(hostSelector));
      });
      it('replaces `:host` with host selector', () => {
        produce({ u: [':', 'host'] });
        expect(renderedSelector).toEqual([{ c: [elementId] }]);
      });

      it('assigns element to `:host` selector', () => {
        produce({ u: [':', 'host'] }, { hostSelector: { e: 'host-element' } });
        expect(renderedSelector).toEqual([{ e: 'host-element' }]);
      });
      it('retains element from `:host(element)` selector', () => {
        produce(
          { u: [':', 'host', { e: 'test-element' }] },
          { hostSelector: { e: 'host-element' } },
        );
        expect(renderedSelector).toEqual([{ e: 'test-element' }]);
      });
      it('retains element and namespace from `:host(ns|element) selector', () => {
        produce({ u: [':', 'host', { ns: 'test-ns' }] }, { hostSelector: { e: 'host-element' } });
        expect(renderedSelector).toEqual([{ ns: 'test-ns' }]);
      });

      it('assigns ID to `:host` selector', () => {
        produce({ u: [':', 'host'] }, { hostSelector: { i: 'host-id' } });
        expect(renderedSelector).toEqual([{ i: 'host-id' }]);
      });
      it('retains ID from `:host(#id)` selector', () => {
        produce({ u: [':', 'host', { i: 'test-id' }] }, { hostSelector: { i: 'host-id' } });
        expect(renderedSelector).toEqual([{ i: 'test-id' }]);
      });

      it('appends class to `:host(.class)` selector', () => {
        produce({ u: [':', 'host', { c: 'test-class' }] });
        expect(renderedSelector).toEqual([{ c: ['test-class', elementId] }]);
      });
      it('retains class of `:host(.class) selector', () => {
        produce({ u: [':', 'host', { c: 'test-class' }] }, { hostSelector: {} });
        expect(renderedSelector).toEqual([{ c: ['test-class'] }]);
      });

      it('appends sub-selector to `:host([attr])` selector', () => {
        produce(
          { u: [':', 'host', { u: ['test-attr'] }] },
          { hostSelector: { u: ['::', 'after'] } },
        );
        expect(renderedSelector).toEqual([{ u: [['test-attr'], ['::', 'after']] }]);
      });
      it('retains sub-selector from `:host([attr])` selector', () => {
        produce({ u: [':', 'host', { u: ['test-attr'] }] }, { hostSelector: {} });
        expect(renderedSelector).toEqual([{ u: [['test-attr']] }]);
      });
      it('assigns sub-selector to `:host` selector', () => {
        produce({ u: [':', 'host'] }, { hostSelector: { u: ['::', 'after'] } });
        expect(renderedSelector).toEqual([{ u: [['::', 'after']] }]);
      });

      it('appends suffix to `:host(.raw)` selector', () => {
        produce({ u: [':', 'host', '.test-suffix'] }, { hostSelector: { s: '.host-suffix' } });
        expect(renderedSelector).toEqual([{ s: '.test-suffix.host-suffix' }]);
      });
      it('retains suffix from `:host(.raw)` selector', () => {
        produce({ u: [':', 'host', '.test-suffix'] }, { hostSelector: {} });
        expect(renderedSelector).toEqual([{ s: '.test-suffix' }]);
      });
      it('assigns suffix to `:host` selector', () => {
        produce({ u: [':', 'host'] }, { hostSelector: { s: '.host-suffix' } });
        expect(renderedSelector).toEqual([{ s: '.host-suffix' }]);
      });

      it('retains qualifiers from `:host` selector', () => {
        produce({ u: [':', 'host'], $: '@test' });
        expect(renderedSelector).toEqual([{ c: [elementId], $: ['@test'] }]);
      });
      it('retains nested `:host` selectors', () => {
        produce([{ u: [':', 'host'] }, { e: 'test-element' }]);
        expect(renderedSelector).toEqual([{ c: [elementId] }, { e: 'test-element' }]);
      });

      it('prefixes combinator with host selector', () => {
        produce(['>', { e: 'test-element' }]);
        expect(renderedSelector).toEqual([{ c: [elementId] }, '>', { e: 'test-element' }]);
      });
      it('prefixes arbitrary selector with host one', () => {
        produce([{ e: 'test-element' }]);
        expect(renderedSelector).toEqual([{ c: [elementId] }, { e: 'test-element' }]);
      });
      it('prefixes arbitrary sub-selector with host selector', () => {
        produce([{ u: ['test-attr'] }]);
        expect(renderedSelector).toEqual([{ c: [elementId] }, { u: [['test-attr']] }]);
      });
    });

    function produce(selector: DoqrySelector, config?: ComponentStypFormatConfig): void {
      const { rules } = stypRoot();
      const rule = rules.add(selector);

      format
        .produce(rule.rules.self, {
          ...config,
          renderer: mockRenderer,
        })
        .needs(done);
    }
  });
});
