import type { RouteMiddleware } from "rwsdk/router";

export const logRequests =
  (): RouteMiddleware =>
  ({ request, path }) => {
    console.log(`[rwsdk] ${request.method} ${path}`);
  };
