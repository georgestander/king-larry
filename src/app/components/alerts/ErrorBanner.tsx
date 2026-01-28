"use client";

import { useState } from "react";

import { Button } from "@/app/components/ui/button";

export type ErrorInfo = {
  message: string;
  details?: string;
  requestId?: string;
};

export const ErrorBanner = ({ error }: { error: ErrorInfo | null }) => {
  const [open, setOpen] = useState(false);

  if (!error) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">Something went wrong</p>
          <p>{error.message}</p>
          {error.requestId && (
            <p className="text-xs text-red-500">Request ID: {error.requestId}</p>
          )}
        </div>
        {error.details && (
          <Button size="sm" variant="ghost" onClick={() => setOpen((prev) => !prev)}>
            {open ? "Hide details" : "Show details"}
          </Button>
        )}
      </div>
      {open && error.details && (
        <pre className="mt-3 whitespace-pre-wrap text-xs text-red-600">{error.details}</pre>
      )}
    </div>
  );
};
