import { Badge } from "@/components/ui/badge";
import ChatClient from "@/app/chat/chat-client";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <div className="container space-y-8">
      <div className="space-y-2">
        <Badge variant="secondary">Chat</Badge>
        <h1 className="font-display text-4xl text-slate-900">League Chat Room</h1>
        <p className="text-slate-600">Talk smack and celebrate playoff wins.</p>
      </div>
      <ChatClient />
    </div>
  );
}
