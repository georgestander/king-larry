"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { loadAiSettings, setStoredAiSettings } from "@/app/lib/ai-settings";
import { MODEL_OPTIONS, getDefaultModel, type ModelOption, type ModelProvider } from "@/lib/models";

const PROVIDER_LABELS: Record<ModelProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  openrouter: "OpenRouter",
};

const PROVIDER_ENV_VARS: Record<ModelProvider, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

export const SettingsClient = () => {
  const [provider, setProvider] = useState<ModelProvider>("openai");
  const [model, setModel] = useState<string>(getDefaultModel("openai"));
  const [modelOptions, setModelOptions] = useState<ModelOption[]>(MODEL_OPTIONS.openai);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<Record<ModelProvider, boolean>>({
    openai: true,
    anthropic: true,
    openrouter: true,
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    loadAiSettings()
      .then(({ settings, providers }) => {
        setAvailableProviders(providers);
        setProvider(settings.provider);
        setModel(settings.model);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    setModelsLoading(true);
    fetch(`/api/models/${provider}`)
      .then((response) => response.json())
      .then((data) => {
        const models = (data as { models?: ModelOption[] }).models;
        setModelOptions(models?.length ? models : MODEL_OPTIONS[provider]);
      })
      .catch(() => setModelOptions(MODEL_OPTIONS[provider]))
      .finally(() => setModelsLoading(false));
  }, [provider]);

  useEffect(() => {
    if (!modelOptions.find((option) => option.id === model)) {
      const next = getDefaultModel(provider);
      setModel(next);
      setStoredAiSettings({ provider, model: next });
      setSavedAt(new Date().toISOString());
      return;
    }
    setStoredAiSettings({ provider, model });
    setSavedAt(new Date().toISOString());
  }, [model, modelOptions, provider]);

  const enabledProviders = useMemo(
    () => (Object.keys(availableProviders) as ModelProvider[]).filter((key) => availableProviders[key]),
    [availableProviders],
  );

  const noProvidersConfigured = enabledProviders.length === 0;

  return (
    <div className="space-y-6">
      <Card className="border-ink-200/70 bg-white/95">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Provider + model are set once here for this MVP and used everywhere (generation, test chat, and runs).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {noProvidersConfigured && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
              <p className="font-semibold">No AI providers configured</p>
              <p className="mt-1 text-xs text-amber-900/80">
                Set at least one API key in your environment (e.g. <span className="font-semibold">OPENAI_API_KEY</span>).
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(value) => setProvider(value as ModelProvider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROVIDER_LABELS) as ModelProvider[]).map((key) => (
                    <SelectItem key={key} value={key} disabled={!availableProviders[key]}>
                      {PROVIDER_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!availableProviders[provider] && (
                <p className="text-xs text-amber-900">
                  {PROVIDER_LABELS[provider]} is disabled because <span className="font-semibold">{PROVIDER_ENV_VARS[provider]}</span> is not set.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Model {modelsLoading ? "(loading…)" : ""}</Label>
              <Select value={model} onValueChange={setModel} disabled={modelsLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-ink-200 bg-ink-50/70 p-4 text-sm text-ink-700">
            <p className="font-semibold text-ink-900">Where this applies</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-ink-600">
              <li>Generating a new script from a brief</li>
              <li>Test chat preview</li>
              <li>Publishing new runs (sessions)</li>
            </ul>
            <p className="mt-3 text-xs text-ink-500">
              Saved {savedAt ? new Date(savedAt).toLocaleTimeString() : "—"} · stored in this browser for now.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

