"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TextStreamChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { Clock, Send } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";

type InterviewClientProps = {
  token: string;
  sessionTitle: string;
  timeLimitMinutes: number;
};

export default function InterviewClient({ token, sessionTitle, timeLimitMinutes }: InterviewClientProps) {
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [completed, setCompleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new TextStreamChatTransport({ api: `/api/interview/${token}/message` }),
    [token],
  );

  const { messages, sendMessage, status, setMessages } = useChat({ transport });
  const isLoading = status === "streaming" || status === "submitted";

  const remaining = useMemo(() => {
    if (!startedAt) return timeLimitMinutes * 60;
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, timeLimitMinutes * 60 - elapsedSeconds);
  }, [startedAt, timeLimitMinutes]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!startedAt) return;
    const timer = setInterval(() => {
      setStartedAt((prev) => (prev ? prev : Date.now()));
    }, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const startInterview = () => {
    setStarted(true);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [{ type: "text", text: "Before we start, what name should I use for you?" }],
      } as any,
    ]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!startedAt) setStartedAt(Date.now());
    const message = input.trim();
    setInput("");
    await sendMessage({ text: message });
  };

  const handleComplete = async () => {
    await fetch(`/api/interview/${token}/complete`, { method: "POST" });
    setCompleted(true);
  };

  return (
    <div className="min-h-screen bg-ink-50 [background-image:radial-gradient(1200px_circle_at_top,_rgba(255,255,255,0.9),_transparent)]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        <Card className="border-ink-200/70 bg-white/90">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">{sessionTitle}</CardTitle>
              <p className="text-sm text-ink-500">Narrative interview — one question at a time.</p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              {Math.ceil(remaining / 60)} min left
            </Badge>
          </CardHeader>
          <CardContent>
            {!started ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-ink-600">
                  This interview is time-boxed to {timeLimitMinutes} minutes. Answers are saved as you go.
                </p>
                <Button onClick={startInterview}>Begin interview</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-4 rounded-2xl border border-ink-200/70 bg-white/80 p-5 shadow-[0_20px_40px_-35px_rgba(15,23,42,0.45)]">
                  {messages.map((message) => (
                    <div key={message.id} className={message.role === "user" ? "text-right" : "text-left"}>
                      <div
                        className={
                          message.role === "user"
                            ? "ml-auto inline-block max-w-[80%] rounded-2xl bg-ink-900 px-4 py-2 text-sm text-ink-50"
                            : "inline-block max-w-[80%] rounded-2xl bg-ink-100/80 px-4 py-2 text-sm text-ink-900"
                        }
                      >
                        {message.parts?.map((part) => (part.type === "text" ? part.text : "")).join("")}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Type your response..."
                  />
                  <Button type="submit" disabled={isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <div className="flex items-center justify-between text-xs text-ink-400">
                  <span>{completed ? "Interview completed" : "You can end anytime."}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleComplete}
                    disabled={completed}
                  >
                    Finish interview
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
