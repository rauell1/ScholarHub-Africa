// NVIDIA models used by ScholarHub. AI_MODEL_LIGHT and AI_MODEL_HEAVY are the
// shared settings used across the Rauell projects. The defaults replace the
// Llama 3.x models this app used before: NVIDIA retired meta/llama-3.3-70b-instruct
// (it answers 410 Gone).
export const DEFAULT_LIGHT_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b';
export const DEFAULT_HEAVY_MODEL = 'nvidia/nemotron-3.5-super-vl-120b-a12b';

const setting = (name: string) => process.env[name]?.trim() || undefined;

/** Student chat. */
export function lightModel(): string {
  return setting('AI_MODEL_LIGHT') ?? DEFAULT_LIGHT_MODEL;
}

/** CSV upload extraction. */
export function heavyModel(): string {
  return setting('AI_MODEL_HEAVY') ?? DEFAULT_HEAVY_MODEL;
}

/** Nightly crawl extraction; NVIDIA_CRAWL_MODEL still works as a fallback. */
export function crawlModel(): string {
  return setting('AI_MODEL_HEAVY') ?? setting('NVIDIA_CRAWL_MODEL') ?? DEFAULT_HEAVY_MODEL;
}
