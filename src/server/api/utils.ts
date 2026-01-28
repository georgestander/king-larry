"use server";

export const json = (data: unknown, init: ResponseInit = {}) =>
  Response.json(data, {
    status: init.status ?? 200,
    headers: init.headers,
  });

export const errorResponse = (status: number, message: string, details?: unknown) =>
  json({ error: message, details }, { status });

export const parseJsonBody = async <T = unknown>(request: Request): Promise<T> => {
  const body = await request.json();
  return body as T;
};

export const textStreamResponse = (stream: ReadableStream<string>) =>
  new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
