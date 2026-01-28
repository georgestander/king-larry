"use client";

import { useEffect, useMemo, useState } from "react";

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
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

type Message = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export const InviteMoreDialog = ({ sessionId }: { sessionId: string }) => {
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleInvite = async () => {
    const list = emails.split(",").map((email) => email.trim()).filter(Boolean);
    if (!list.length) {
      setError("Add at least one email.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await fetch(`/api/sessions/${sessionId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: list }),
      });
      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite links.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Invite more
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite participants</DialogTitle>
          <DialogDescription>
            Add comma-separated emails to create invite links (you’ll copy/share them — no automatic email sending yet).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Emails</Label>
            <Textarea
              value={emails}
              onChange={(event) => setEmails(event.target.value)}
              placeholder="alex@company.com, jamie@company.com"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={saving}>
            Create invite links
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InviteLinkButton = ({ token }: { token: string }) => {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const inviteUrl = useMemo(
    () => (origin ? `${origin}/interview/${token}` : `/interview/${token}`),
    [origin, token],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input readOnly value={inviteUrl} className="h-8 max-w-[220px] text-xs" />
      <Button size="sm" variant="outline" onClick={handleCopy}>
        {copied ? "Copied" : "Copy link"}
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <a href={inviteUrl} target="_blank" rel="noreferrer">
          Open
        </a>
      </Button>
    </div>
  );
};

export const ParticipantActions = ({
  participantId,
  inviteToken,
  label,
}: {
  participantId: string;
  inviteToken: string;
  label: string;
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <InviteLinkButton token={inviteToken} />
    <TranscriptDialog participantId={participantId} label={label} />
  </div>
);

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
          {loading && <p className="text-sm text-ink-500">Loading...</p>}
          {!loading && messages.length === 0 && (
            <p className="text-sm text-ink-500">No messages yet.</p>
          )}
          {messages.map((message) => (
            <Card key={message.id} className="p-3">
              <p className="text-xs uppercase text-ink-400">{message.role}</p>
              <p className="text-sm text-ink-700">{message.content}</p>
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
