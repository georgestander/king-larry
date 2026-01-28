import type { ModelProvider } from "@/lib/models";
import { getDefaultModel } from "@/lib/models";

export type AiSettings = {
  provider: ModelProvider;
  model: string;
};

const STORAGE_KEYS = {
  provider: "studioAiProvider",
  model: "studioAiModel",
} as const;

const parseProvider = (value: string | null): ModelProvider | null => {
  if (value === "openai" || value === "anthropic" || value === "openrouter") return value;
  return null;
};

export const getStoredAiSettings = (): AiSettings | null => {
  if (typeof window === "undefined") return null;
  const provider = parseProvider(window.localStorage.getItem(STORAGE_KEYS.provider));
  const model = window.localStorage.getItem(STORAGE_KEYS.model);
  if (!provider || !model) return null;
  return { provider, model };
};

export const setStoredAiSettings = (settings: AiSettings) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.provider, settings.provider);
  window.localStorage.setItem(STORAGE_KEYS.model, settings.model);
};

export const loadAiSettings = async (): Promise<{
  settings: AiSettings;
  providers: Record<ModelProvider, boolean>;
}> => {
  const stored = getStoredAiSettings();

  const fallbackProviders: Record<ModelProvider, boolean> = {
    openai: true,
    anthropic: true,
    openrouter: true,
  };

  const response = await fetch("/api/config").catch(() => null);
  const payload = response && response.ok ? await response.json().catch(() => ({})) : {};
  const providers = (payload as { providers?: Record<ModelProvider, boolean> }).providers ?? fallbackProviders;
  const defaults = (payload as { defaults?: { provider?: ModelProvider; model?: string } }).defaults;

  const enabledProviders = (Object.keys(providers) as ModelProvider[]).filter((key) => providers[key]);
  const fallbackProvider = enabledProviders[0] ?? defaults?.provider ?? stored?.provider ?? "openai";

  const preferredProvider = stored?.provider ?? defaults?.provider ?? "openai";
  const provider = providers[preferredProvider] ? preferredProvider : fallbackProvider;

  const providerChanged = stored?.provider && stored.provider !== provider;
  const modelFromDefaults = defaults?.provider === provider ? defaults?.model : null;
  const model = providerChanged
    ? (modelFromDefaults ?? getDefaultModel(provider))
    : (stored?.model ?? modelFromDefaults ?? getDefaultModel(provider));

  const next = { provider, model: model || getDefaultModel(provider) };
  setStoredAiSettings(next);

  return { settings: next, providers };
};

