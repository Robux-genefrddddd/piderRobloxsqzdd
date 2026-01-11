import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { getTicket, addMessageToTicket, Ticket } from "@/lib/ticketService";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";

export default function SupportTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ticketId) return;
    loadTicket();
    const interval = setInterval(() => loadTicket(), 3000); // Real-time polling
    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadTicket = async () => {
    try {
      if (!ticketId) return;
      const ticketData = await getTicket(ticketId);
      if (ticketData) {
        setTicket(ticketData);
      }
    } catch (error) {
      console.error("Error loading ticket:", error);
      toast.error("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !ticketId || !user || !userProfile) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);

    try {
      await addMessageToTicket(
        ticketId,
        user.uid,
        userProfile.displayName,
        "user",
        message,
      );

      setMessage("");
      await loadTicket();
      toast.success("Message sent");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-400" />
          <h1 className="text-2xl font-bold">Ticket not found</h1>
          <Link to="/support">
            <Button>Back to Support</Button>
          </Link>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate("/support")}
              className="p-2 hover:bg-secondary/40 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{ticket.subject}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Ticket #{ticket.id.substring(0, 8).toUpperCase()}
              </p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(ticket.status)}`}
            >
              {ticket.status}
            </span>
          </div>

          {/* Ticket Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary/30 border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="text-sm font-semibold capitalize">
                {ticket.category.replace("-", " ")}
              </p>
            </div>
            <div className="bg-secondary/30 border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Priority</p>
              <p
                className={`text-sm font-semibold ${getPriorityColor(ticket.priority)}`}
              >
                {ticket.priority}
              </p>
            </div>
            <div className="bg-secondary/30 border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm font-semibold">
                {ticket.createdAt.toLocaleDateString()}
              </p>
            </div>
            <div className="bg-secondary/30 border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Assigned To</p>
              <p className="text-sm font-semibold">
                {ticket.assignedToName || "Unassigned"}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-secondary/30 border border-border rounded-lg p-4 space-y-4 h-96 overflow-y-auto flex flex-col">
            {ticket.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.senderId === user?.uid ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs space-y-1 ${
                    msg.senderId === user?.uid ? "text-right" : ""
                  }`}
                >
                  <p className="text-xs text-muted-foreground">
                    {msg.senderName}
                    {msg.senderRole === "support" && (
                      <span className="ml-1 text-primary">🛠️ Support</span>
                    )}
                  </p>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      msg.senderId === user?.uid
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-secondary/50 border border-border rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {msg.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {ticket.status !== "closed" && (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={sending || !message.trim()}
                className="gap-2"
              >
                <Send size={16} />
                Send
              </Button>
            </form>
          )}

          {ticket.status === "closed" && (
            <div className="p-4 bg-secondary/30 border border-border rounded-lg text-center text-muted-foreground">
              This ticket is closed. You can no longer send messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
