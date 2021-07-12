import { immediateRenderScheduler, RenderSchedule, RenderScheduleOptions } from '@frontmeans/render-scheduler';
import { StypRenderer } from '@frontmeans/style-producer';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CxBuilder, cxConstAsset } from '@proc7ts/context-builder';
import { CxGlobals } from '@proc7ts/context-values';
import { noop } from '@proc7ts/primitives';
import { ComponentContext, ComponentRenderScheduler } from '@wesib/wesib';
import { Mock } from 'jest-mock';
import { componentStypDomFormatConfig } from './component-styp-dom.format-config';
import { ComponentStypFormat } from './component-styp-format';

describe('componentStypDomFormatConfig', () => {

  let context: ComponentContext;
  let format: ComponentStypFormat;
  let scheduler: Mock<RenderSchedule, [RenderScheduleOptions?]>;

  beforeEach(() => {

    const cxBuilder = new CxBuilder<ComponentContext>(get => ({
      element: document.createElement('test-element'),
      get,
    } as Partial<ComponentContext> as ComponentContext));

    scheduler = jest.fn(immediateRenderScheduler);
    cxBuilder.provide(cxConstAsset(ComponentRenderScheduler, scheduler));

    context = cxBuilder.context;
    cxBuilder.provide(cxConstAsset(CxGlobals, context));

    format = {
      context,
      renderer(): StypRenderer {
        return noop;
      },
    } as any;
  });

  it('does not modify schedule options by default', () => {

    const config = componentStypDomFormatConfig(format);

    config.scheduler!()(noop);
    expect(scheduler).toHaveBeenCalledWith({});
  });
  it('applies render definition to schedule options by default', () => {

    const config = componentStypDomFormatConfig(format, undefined, { when: 'connected' });

    config.scheduler!({ window })(noop);
    expect(scheduler).toHaveBeenCalledWith({ window, when: 'connected' });
  });
});
