// Two-model rule (owner's standing instruction, 25 November 2026): ScholarHub
// uses exactly two NVIDIA models, a heavy one and a light one, and no other.
//
//   AI_MODEL_HEAVY1  live heavy model (crawl and CSV extraction)
//   AI_MODEL_LIGHT1  live light model (student chat)
//   AI_MODEL_HEAVY2  spare heavy model, used only while AI_MODEL_HEAVY1 is empty
//   AI_MODEL_LIGHT2  spare light model, used only while AI_MODEL_LIGHT1 is empty
//
// Every call tries its own tier's model, then the other one once.
export const DEFAULT_LIGHT_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b';
export const DEFAULT_HEAVY_MODEL = 'nvidia/nemotron-3.5-super-vl-120b-a12b';

export type Tier = 'heavy' | 'light';

const setting = (name: string) => process.env[name]?.trim() || undefined;

/** Student chat. */
export function lightModel(): string {
  return setting('AI_MODEL_LIGHT1') ?? setting('AI_MODEL_LIGHT2') ?? DEFAULT_LIGHT_MODEL;
}

/** Crawl and CSV upload extraction. */
export function heavyModel(): string {
  return setting('AI_MODEL_HEAVY1') ?? setting('AI_MODEL_HEAVY2') ?? DEFAULT_HEAVY_MODEL;
}

/** The tier's model, then the other one (one entry if both slots name the same model). */
export function modelOrder(first: Tier): string[] {
  const order = first === 'heavy' ? [heavyModel(), lightModel()] : [lightModel(), heavyModel()];
  return [...new Set(order)];
}

/**
 * Runs `call` on the tier's model, then once on the other model if it throws
 * or `isCutOff` says the reply stopped at the token limit. A cut-off reply is
 * returned only when the other model does no better.
 */
export async function withModelFallback<T>(
  first: Tier,
  call: (model: string) => Promise<T>,
  isCutOff: (result: T) => boolean = () => false,
): Promise<T> {
  let cutOff: { result: T } | undefined;
  let lastError: unknown;
  for (const model of modelOrder(first)) {
    try {
      const result = await call(model);
      if (!isCutOff(result)) return result;
      cutOff ??= { result };
    } catch (error) {
      lastError = error;
      console.warn(`[ai] model ${model} failed`, error instanceof Error ? error.message : error);
    }
  }
  if (cutOff) return cutOff.result;
  throw lastError ?? new Error('No NVIDIA model answered');
}
