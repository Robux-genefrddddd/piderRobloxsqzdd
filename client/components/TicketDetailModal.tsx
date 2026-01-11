import { X, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { addMessageToTicket, Ticket } from "@/lib/ticketService";

interface TicketDetailModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  currentUserRole?: string;
  currentUserName?: string;
  currentUserId?: string;
  onMessageAdded?: () => void;
}

export function TicketDetailModal({
  ticket,
  onClose,
  currentUserRole,
  currentUserName,
  currentUserId,
  onMessageAdded,
}: TicketDetailModalProps) {
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  if (!ticket) return null;

  const canViewMessages =
    currentUserRole === "founder" || currentUserRole === "support";

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!canViewMessages) {
      toast.error("You don't have permission to send messages");
      return;
    }

    if (!currentUserId || !currentUserName) {
      toast.error("User information not available");
      return;
    }

    setSending(true);

    try {
      await addMessageToTicket(
        ticket.id,
        currentUserId,
        currentUserName,
        "support",
        messageText,
      );

      setMessageText("");
      toast.success("Message sent");
      onMessageAdded?.();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/20 text-blue-400";
      case "in-progress":
        return "bg-yellow-500/20 text-yellow-400";
      case "waiting":
        return "bg-purple-500/20 text-purple-400";
      case "resolved":
        return "bg-green-500/20 text-green-400";
      case "closed":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "text-gray-400";
      case "normal":
        return "text-blue-400";
      case "high":
        return "text-orange-400";
      case "critical":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border/40 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/20 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold truncate">{ticket.subject}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ticket #{ticket.id.substring(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary/50 rounded-lg transition-colors flex-shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Ticket Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-secondary/30 border border-border/20 rounded p-3">
              <p className="text-xs text-muted-foreground">Status</p>
              <p
                className={`text-sm font-semibold mt-1 ${
                  getStatusColor(ticket.status).split(" ")[1]
                }`}
              >
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}
                >
                  {ticket.status}
                </span>
              </p>
            </div>
            <div className="bg-secondary/30 border border-border/20 rounded p-3">
              <p className="text-xs text-muted-foreground">Priority</p>
              <p
                className={`text-sm font-semibold mt-1 ${getPriorityColor(ticket.priority)}`}
              >
                {ticket.priority}
              </p>
            </div>
            <div className="bg-secondary/30 border border-border/20 rounded p-3">
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="text-sm font-semibold mt-1 capitalize">
                {ticket.category.replace("-", " ")}
              </p>
            </div>
            <div className="bg-secondary/30 border border-border/20 rounded p-3">
              <p className="text-xs text-muted-foreground">Assigned To</p>
              <p className="text-sm font-semibold mt-1">
                {ticket.assignedToName || "Unassigned"}
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-secondary/20 border border-border/20 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">From</p>
            <p className="text-sm font-medium text-foreground">
              {ticket.userName}
            </p>
            <p className="text-xs text-muted-foreground">{ticket.userEmail}</p>
            <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
              <Clock size={14} className="flex-shrink-0" />
              <span>{ticket.createdAt.toLocaleString()}</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-secondary/20 border border-border/20 rounded p-3">
            <p className="text-xs text-muted-foreground mb-2">Description</p>
            <p className="text-sm text-foreground/90">{ticket.description}</p>
          </div>

          {/* Messages Section - Only for founder/support */}
          {canViewMessages ? (
            <div className="border border-border/20 rounded p-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 mb-3">
                Conversation
              </p>

              {/* Messages List */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {ticket.messages && ticket.messages.length > 0 ? (
                  ticket.messages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-medium text-foreground">
                          {msg.senderName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {msg.senderRole === "support" && (
                            <span className="text-primary ml-2">
                              🛠️ Support
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {msg.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-secondary/30 border border-border/20 rounded px-3 py-2">
                        <p className="text-foreground/90 break-words">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No messages yet
                  </p>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Type your response..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={sending}
                  className="text-sm h-9"
                />
                <Button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  size="sm"
                  className="flex-shrink-0"
                >
                  {sending ? "Sending..." : "Send"}
                </Button>
              </form>
            </div>
          ) : (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3">
              <AlertTriangle
                size={18}
                className="text-yellow-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-yellow-600">
                  No Permission
                </p>
                <p className="text-xs text-yellow-600/80">
                  Only founders and support staff can view ticket messages.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/20 p-4 bg-card/50 flex-shrink-0">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
