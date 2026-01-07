"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ChatMessage = {
  id: string;
  entryId: string;
  message: string;
  createdAt: string;
  participantName: string;
  email: string;
};

export default function ChatClient() {
  const [email, setEmail] = useState("");
  const [entryId, setEntryId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedEntryId = localStorage.getItem("chatEntryId");
    const storedEmail = localStorage.getItem("chatEmail");
    const storedName = localStorage.getItem("chatName");
    if (storedEntryId && storedEmail && storedName) {
      setEntryId(storedEntryId);
      setEmail(storedEmail);
      setParticipantName(storedName);
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/chat")
      .then((res) => setAdminMode(res.ok))
      .catch(() => setAdminMode(false));
  }, []);

  useEffect(() => {
    if (!entryId && !adminMode) return;
    let active = true;

    async function fetchMessages() {
      try {
        const response = await fetch("/api/chat/messages");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load messages");
        }
        if (active) {
          setMessages(data);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load messages");
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [adminMode, entryId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages]);

  async function handleLogin() {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Enter your email to join the chat.");
      return;
    }
    setLoading(true);
    try {
      const adminResponse = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: trimmed }),
      });
      if (adminResponse.ok) {
        setAdminMode(true);
        setEntryId(null);
        setParticipantName("Admin");
        localStorage.removeItem("chatEntryId");
        localStorage.removeItem("chatEmail");
        localStorage.removeItem("chatName");
        toast.success("Admin mode enabled.");
        return;
      }

      if (!trimmed.includes("@")) {
        toast.error("Enter a valid email.");
        return;
      }

      const response = await fetch("/api/entries/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Entry not found");
      }
      setEntryId(payload.id);
      setParticipantName(payload.participantName);
      setAdminMode(false);
      localStorage.setItem("chatEntryId", payload.id);
      localStorage.setItem("chatEmail", trimmed);
      localStorage.setItem("chatName", payload.participantName);
      toast.success("Welcome to the chat!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!entryId && !adminMode) return;
    if (!messageInput.trim()) return;
    setSending(true);
    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: entryId ?? undefined,
          message: messageInput.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to send message");
      }
      setMessages((prev) => [...prev, payload]);
      setMessageInput("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage() {
    if (!deleteTarget) return;
    try {
      const response = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", messageId: deleteTarget.id }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Delete failed");
      }
      setMessages((prev) => prev.filter((message) => message.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Message deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  async function handleClearChat() {
    try {
      const response = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Clear failed");
      }
      setMessages([]);
      setClearOpen(false);
      toast.success("Chat cleared.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Clear failed");
    }
  }

  function handleLogout() {
    setEntryId(null);
    setEmail("");
    setParticipantName("");
    setAdminMode(false);
    setMessages([]);
    localStorage.removeItem("chatEntryId");
    localStorage.removeItem("chatEmail");
    localStorage.removeItem("chatName");
    fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
  }

  if (!entryId && !adminMode) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Join the Chat</CardTitle>
          <CardDescription>
            Enter the email you used to create your roster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (!loading) {
                handleLogin();
              }
            }}
          >
            <Input
              type="text"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Checking..." : "Enter Chat"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-slate-900">Chat Room</h2>
          <p className="text-sm text-slate-500">
            {adminMode ? "Admin mode enabled" : `Signed in as ${participantName}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleLogout}>
            Change user
          </Button>
        </div>
      </div>

      {adminMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-medium">Admin mode enabled</span>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setClearOpen(true)}>
              Clear all chat
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="glass-card">
        <CardContent className="h-[420px] overflow-y-auto px-4 py-6">
          <div className="space-y-4">
            {sortedMessages.map((message) => {
              const isMine = entryId ? message.entryId === entryId : adminMode && message.entryId === null;
              return (
                <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%]">
                    <div className={`flex items-center gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                      <span className="text-xs font-semibold text-slate-500">{message.participantName}</span>
                      {adminMode ? (
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(message)}>
                          Delete
                        </Button>
                      ) : null}
                    </div>
                    <div
                      className={`mt-1 inline-block max-w-full rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        isMine ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-800"
                      }`}
                    >
                      {message.message}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {entryId || adminMode ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Type your message..."
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (!sending) handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={sending || !messageInput.trim()}>
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      ) : null}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete message</DialogTitle>
            <DialogDescription>
              This will remove the message from{" "}
              <span className="font-semibold text-slate-900">{deleteTarget?.participantName}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMessage}>
              Delete message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear chat history</DialogTitle>
            <DialogDescription>
              This will permanently delete all chat messages for everyone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearChat}>
              Clear chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
