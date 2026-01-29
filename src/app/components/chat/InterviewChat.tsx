"use client";

import { useEffect, useRef } from "react";
import { Clock, Loader2, Send } from "lucide-react";
import type { UIMessage } from "ai";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";

type InterviewChatProps = {
  title: string;
  subtitle: string;
  timeLimitMinutes: number;
  remainingSeconds: number;
  started: boolean;
  messages: UIMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onStart: () => void;
  startDisabled?: boolean;
  inputDisabled?: boolean;
  onComplete?: () => void;
  isLoading: boolean;
  completed: boolean;
  showFinish?: boolean;
  layout?: "page" | "embedded";
  className?: string;
};

const getMessageText = (message: UIMessage) => {
  if ("parts" in message && Array.isArray(message.parts)) {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("");
  }
  if ("content" in message && Array.isArray(message.content)) {
    return message.content
      .filter((part: { type: string }) => part.type === "text")
      .map((part: { type: string; text?: string }) => part.text ?? "")
      .join("");
  }
  return "";
};

type MessageSegment = { kind: "narrative" | "question"; text: string };

const splitNarrativeAndQuestions = (text: string): MessageSegment[] => {
  const segments: MessageSegment[] = [];
  const source = text ?? "";
  let cursor = 0;

  while (cursor < source.length) {
    const qIndex = source.indexOf("?", cursor);
    if (qIndex === -1) break;

    let start = cursor;
    for (let i = qIndex - 1; i >= cursor; i--) {
      const char = source[i];
      if (char === "\n") {
        start = i + 1;
        break;
      }
      if ((char === "." || char === "!" || char === "?") && /\s/.test(source[i + 1] ?? "")) {
        start = i + 1;
        break;
      }
    }

    const narrative = source.slice(cursor, start).trim();
    if (narrative) segments.push({ kind: "narrative", text: narrative });

    const question = source.slice(start, qIndex + 1).trim();
    if (question) segments.push({ kind: "question", text: question });

    cursor = qIndex + 1;
  }

  const rest = source.slice(cursor).trim();
  if (rest) segments.push({ kind: "narrative", text: rest });

  return segments;
};

export const InterviewChat = ({
  title,
  subtitle,
  timeLimitMinutes,
  remainingSeconds,
  started,
  messages,
  input,
  onInputChange,
  onSubmit,
  onStart,
  startDisabled = false,
  inputDisabled = false,
  onComplete,
  isLoading,
  completed,
  showFinish = true,
  layout = "page",
  className,
}: InterviewChatProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isEmbedded = layout === "embedded";

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [messages, isLoading]);

  const outerClassName = isEmbedded
    ? ""
    : "min-h-screen bg-ink-50 [background-image:radial-gradient(1200px_circle_at_top,_rgba(255,255,255,0.9),_transparent)]";
  const containerClassName = isEmbedded
    ? ""
    : "mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10";
  const chatPanelHeight = isEmbedded ? "h-[62vh]" : "h-[68vh]";

  const chatCard = (
    <Card className={cn("border-ink-200/70 bg-white/90", className)}>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <p className="text-sm text-ink-500">{subtitle}</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          {Math.ceil(remainingSeconds / 60)} min left
        </Badge>
      </CardHeader>
      <CardContent>
        {!started ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-ink-600">
              This interview is time-boxed to {timeLimitMinutes} minutes. Answers are saved as you go.
            </p>
            <Button onClick={onStart} disabled={startDisabled}>Begin interview</Button>
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white/80 shadow-[0_20px_40px_-35px_rgba(15,23,42,0.45)]",
              chatPanelHeight,
            )}
          >
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5 pr-4">
              {messages.map((message) => (
                <div key={message.id} className={message.role === "user" ? "text-right" : "text-left"}>
                  <div
                    className={
                      message.role === "user"
                        ? "ml-auto inline-block max-w-[80%] rounded-2xl bg-ink-900 px-4 py-2 text-sm text-ink-50"
                        : "inline-block max-w-[80%] rounded-2xl bg-ink-100/80 px-4 py-2 text-sm text-ink-900"
                    }
                  >
                    {message.role !== "user"
                      ? (
                        <div className="space-y-2 whitespace-pre-wrap">
                          {splitNarrativeAndQuestions(getMessageText(message)).map((segment, index) => (
                            <p
                              key={`${message.id}-${index}`}
                              className={segment.kind === "question" ? "font-semibold" : ""}
                            >
                              {segment.text}
                            </p>
                          ))}
                        </div>
                      )
                      : getMessageText(message)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-ink-100/80 px-4 py-2 text-sm text-ink-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading response…
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-ink-200/70 bg-white/95 p-4">
              <form onSubmit={onSubmit} className="mx-auto flex max-w-2xl gap-2">
                <Input
                  value={input}
                  onChange={(event) => onInputChange(event.target.value)}
                  placeholder="Type your response..."
                  disabled={inputDisabled || isLoading}
                />
                <Button type="submit" disabled={inputDisabled || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>

              {showFinish && (
                <div className="mx-auto mt-3 flex max-w-2xl items-center justify-between text-xs text-ink-400">
                  <span>{completed ? "Interview completed" : "You can end anytime."}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onComplete}
                    disabled={completed}
                  >
                    Finish interview
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isEmbedded) {
    return chatCard;
  }

  return (
    <div className={outerClassName}>
      <div className={containerClassName}>{chatCard}</div>
    </div>
  );
};
