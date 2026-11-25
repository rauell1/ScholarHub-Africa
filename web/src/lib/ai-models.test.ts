import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_HEAVY_MODEL, DEFAULT_LIGHT_MODEL, heavyModel, lightModel, modelOrder, withModelFallback } from './ai-models';

beforeEach(() => {
  for (const k of ['AI_MODEL_HEAVY1', 'AI_MODEL_HEAVY2', 'AI_MODEL_LIGHT1', 'AI_MODEL_LIGHT2']) vi.stubEnv(k, '');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.unstubAllEnvs());

describe('two-model rule', () => {
  it('uses slot 1, else the slot 2 spare, else the defaults', () => {
    expect([heavyModel(), lightModel()]).toEqual([DEFAULT_HEAVY_MODEL, DEFAULT_LIGHT_MODEL]);
    vi.stubEnv('AI_MODEL_HEAVY2', 'spare/heavy');
    expect(heavyModel()).toBe('spare/heavy');
    vi.stubEnv('AI_MODEL_HEAVY1', 'live/heavy');
    expect(heavyModel()).toBe('live/heavy');
  });

  it('orders the two models by tier', () => {
    expect(modelOrder('heavy')).toEqual([DEFAULT_HEAVY_MODEL, DEFAULT_LIGHT_MODEL]);
    expect(modelOrder('light')).toEqual([DEFAULT_LIGHT_MODEL, DEFAULT_HEAVY_MODEL]);
  });

  it('retries once on the other model after a failure or a cut-off reply, never a third', async () => {
    const seen: string[] = [];
    const result = await withModelFallback('heavy', async (model) => {
      seen.push(model);
      if (model === DEFAULT_HEAVY_MODEL) throw new Error('503');
      return { model, finish: 'stop' };
    });
    expect(result.model).toBe(DEFAULT_LIGHT_MODEL);
    expect(seen).toEqual([DEFAULT_HEAVY_MODEL, DEFAULT_LIGHT_MODEL]);

    const cut = await withModelFallback('light', async (model) => ({ model, finish: 'length' }), (r) => r.finish === 'length');
    expect(cut.model).toBe(DEFAULT_LIGHT_MODEL);

    await expect(withModelFallback('light', async () => { throw new Error('down'); })).rejects.toThrow('down');
  });
});
