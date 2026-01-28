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
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
      <Card className="border-slate-200/80">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">{sessionTitle}</CardTitle>
            <p className="text-sm text-slate-500">Narrative interview — one question at a time.</p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            {Math.ceil(remaining / 60)} min left
          </Badge>
        </CardHeader>
        <CardContent>
          {!started ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-slate-600">
                This interview is time-boxed to {timeLimitMinutes} minutes. Answers are saved as you go.
              </p>
              <Button onClick={startInterview}>Begin interview</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-4 rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm">
                {messages.map((message) => (
                  <div key={message.id} className={message.role === "user" ? "text-right" : "text-left"}>
                    <div
                      className={
                        message.role === "user"
                          ? "ml-auto inline-block max-w-[80%] rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white"
                          : "inline-block max-w-[80%] rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-900"
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
              <div className="flex items-center justify-between text-xs text-slate-400">
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
  );
}
