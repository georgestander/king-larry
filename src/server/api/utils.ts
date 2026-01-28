"use server";

import { env } from "cloudflare:workers";

export const json = (data: unknown, init: ResponseInit = {}) =>
  Response.json(data, {
    status: init.status ?? 200,
    headers: init.headers,
  });

export const errorResponse = (status: number, message: string, details?: unknown) =>
  json({ error: message, details, requestId: crypto.randomUUID() }, { status });

export const parseJsonBody = async <T = unknown>(request: Request): Promise<T> => {
  const body = await request.json();
  return body as T;
};

export const textStreamResponse = (stream: ReadableStream<string>) =>
  new Response(stream.pipeThrough(new TextEncoderStream()), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });

export const prependTextStream = (prefix: string, stream: ReadableStream<string>) => {
  if (!prefix) return stream;
  const reader = stream.getReader();
  let started = false;
  return new ReadableStream<string>({
    async pull(controller) {
      if (!started) {
        controller.enqueue(prefix);
        started = true;
      }
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) {
      reader.cancel(reason).catch(() => undefined);
    },
  });
};

export const isMockAiEnabled = () => {
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const value = runtimeEnv.MOCK_AI ?? "";
  return value === "1" || value.toLowerCase() === "true";
};
