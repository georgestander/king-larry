"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";

type Message = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export const TranscriptDialog = ({ participantId, label }: { participantId: string; label: string }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/participants/${participantId}/transcript`)
      .then((res) => res.json())
      .then((data) => setMessages((data as { transcript?: Message[] }).transcript ?? []))
      .finally(() => setLoading(false));
  }, [open, participantId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View transcript
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>Conversation transcript</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          {loading && <p className="text-sm text-slate-500">Loading...</p>}
          {!loading && messages.length === 0 && (
            <p className="text-sm text-slate-500">No messages yet.</p>
          )}
          {messages.map((message) => (
            <Card key={message.id} className="p-3">
              <p className="text-xs uppercase text-slate-400">{message.role}</p>
              <p className="text-sm text-slate-700">{message.content}</p>
            </Card>
          ))}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
