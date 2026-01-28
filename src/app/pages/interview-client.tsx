"use client";

import { useEffect, useMemo, useState } from "react";
import { TextStreamChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import { InterviewChat } from "@/app/components/chat/InterviewChat";

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
  const [layout, setLayout] = useState<"page" | "embedded">("page");

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
    const params = new URLSearchParams(window.location.search);
    if (params.get("embed") === "1" || params.get("embed") === "true") {
      setLayout("embedded");
    }
  }, []);

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
    <InterviewChat
      title={sessionTitle}
      subtitle="Narrative interview — one question at a time."
      timeLimitMinutes={timeLimitMinutes}
      remainingSeconds={remaining}
      started={started}
      messages={messages}
      input={input}
      onInputChange={setInput}
      onSubmit={handleSubmit}
      onStart={startInterview}
      onComplete={handleComplete}
      isLoading={isLoading}
      completed={completed}
      showFinish
      layout={layout}
    />
  );
}
