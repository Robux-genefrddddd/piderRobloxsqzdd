import { X, Clock, AlertTriangle, Check, CheckCheck } from "lucide-react";
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
  const [isTyping, setIsTyping] = useState(false);

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
    setIsTyping(true);

    try {
      await addMessageToTicket(
        ticket.id,
        currentUserId,
        currentUserName,
        currentUserRole as "user" | "support" | "admin" | "founder",
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
      setIsTyping(false);
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "founder":
        return {
          label: "Founder",
          color: "bg-purple-500/20 text-purple-400",
          svg: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ),
        };
      case "admin":
        return {
          label: "Admin",
          color: "bg-blue-500/20 text-blue-400",
          svg: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
          ),
        };
      case "support":
        return {
          label: "Support",
          color: "bg-amber-500/20 text-amber-400",
          svg: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 5h-2v2h2V5zm0 4h-2v6h2V9zm5.84-2.5c.8-1.6 1.16-3.3 1.16-5.5 0-5.5-4.5-10-10-10S0 0 0 5.5 4.5 15.5 10 15.5c2.2 0 3.9-.36 5.5-1.16l2.05 2.05c.3.3.75.46 1.2.46.9 0 1.65-.75 1.65-1.65 0-.45-.15-.9-.46-1.2l-2.06-2.04z" />
            </svg>
          ),
        };
      default:
        return {
          label: "User",
          color: "bg-gray-500/20 text-gray-400",
          svg: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          ),
        };
    }
  };

  const isUserMessage = (msg: any) => msg.senderRole === "user";
  const isStaffMessage = (msg: any) =>
    ["support", "admin", "founder"].includes(msg.senderRole);

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
                  ticket.messages.map((msg) => {
                    const isUser = isUserMessage(msg);
                    const isStaff = isStaffMessage(msg);
                    const badge = getRoleBadge(msg.senderRole);

                    return (
                      <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div className={`flex gap-2 max-w-xs ${isUser ? "flex-row-reverse" : ""}`}>
                          {/* Message Bubble */}
                          <div className="flex flex-col gap-1 flex-1">
                            {/* Sender Name with Role Logo */}
                            {isStaff && !isUser && (
                              <div className="flex items-center gap-1.5 px-1">
                                <div className={`w-5 h-5 flex items-center justify-center ${badge.color}`}>
                                  {badge.svg}
                                </div>
                                <span className="text-xs font-semibold text-foreground">
                                  {msg.senderName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {badge.label}
                                </span>
                              </div>
                            )}

                            <div
                              className={`rounded-lg px-3 py-2 ${
                                isUser
                                  ? "bg-primary text-primary-foreground rounded-br-none"
                                  : isStaff
                                    ? "bg-secondary/50 text-foreground border border-border/30 rounded-bl-none"
                                    : "bg-secondary/30 text-foreground/90 rounded-bl-none"
                              }`}
                            >
                              <p className="text-sm break-words whitespace-pre-wrap">
                                {msg.message}
                              </p>
                            </div>

                            {/* Timestamp and Read Status */}
                            <div
                              className={`flex items-center gap-1 text-xs text-muted-foreground px-1 ${
                                isUser ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span>{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              {isUser && msg.isRead && (
                                <CheckCheck size={14} className="text-primary" />
                              )}
                              {isUser && !msg.isRead && (
                                <Check size={14} className="text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No messages yet
                  </p>
                )}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-end">
                    <div className="bg-primary/20 text-primary-foreground rounded-lg px-3 py-2 rounded-br-none">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
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
