"use client";

import { useEffect, useRef } from "react";
import { Clock, Loader2, Send } from "lucide-react";
import type { UIMessage } from "ai";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";

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
  onComplete?: () => void;
  isLoading: boolean;
  completed: boolean;
  showFinish?: boolean;
};

const getMessageText = (message: UIMessage) =>
  message.parts?.map((part) => (part.type === "text" ? part.text : "")).join("") ?? "";

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
  onComplete,
  isLoading,
  completed,
  showFinish = true,
}: InterviewChatProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const threshold = 120;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    if (isNearBottom) {
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages, isLoading]);

  return (
    <div className="min-h-screen bg-ink-50 [background-image:radial-gradient(1200px_circle_at_top,_rgba(255,255,255,0.9),_transparent)]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        <Card className="border-ink-200/70 bg-white/90">
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
                <Button onClick={onStart}>Begin interview</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex-1 space-y-4 rounded-2xl border border-ink-200/70 bg-white/80 p-5 shadow-[0_20px_40px_-35px_rgba(15,23,42,0.45)]">
                  <div ref={scrollRef} className="max-h-[55vh] min-h-[220px] space-y-4 overflow-y-auto pr-2">
                  {messages.map((message) => (
                    <div key={message.id} className={message.role === "user" ? "text-right" : "text-left"}>
                      <div
                        className={
                          message.role === "user"
                            ? "ml-auto inline-block max-w-[80%] rounded-2xl bg-ink-900 px-4 py-2 text-sm text-ink-50"
                            : "inline-block max-w-[80%] rounded-2xl bg-ink-100/80 px-4 py-2 text-sm text-ink-900"
                        }
                      >
                        {getMessageText(message)}
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
                </div>
                <form onSubmit={onSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(event) => onInputChange(event.target.value)}
                    placeholder="Type your response..."
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
                {showFinish && (
                  <div className="flex items-center justify-between text-xs text-ink-400">
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
