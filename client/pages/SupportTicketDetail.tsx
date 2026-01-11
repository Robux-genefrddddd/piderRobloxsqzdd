import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { getTicket, addMessageToTicket, Ticket } from "@/lib/ticketService";
import { getMemberRankColor, getMemberRankLabel, DEFAULT_PROFILE_IMAGE } from "@/lib/auth";
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const previousMessageCount = useRef(0);

  useEffect(() => {
    if (!ticketId) return;
    loadTicket();
    const interval = setInterval(() => loadTicket(), 3000); // Real-time polling
    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    // Load user profiles for all message senders
    const loadUserProfiles = async () => {
      if (!ticket?.messages) return;

      const senderIds = Array.from(
        new Set(ticket.messages.map((msg) => msg.senderId))
      );

      const profiles: Record<string, UserProfile | null> = {};

      for (const senderId of senderIds) {
        if (!userProfiles[senderId]) {
          const profile = await getUserProfile(senderId);
          profiles[senderId] = profile;
        }
      }

      setUserProfiles((prev) => ({ ...prev, ...profiles }));
    };

    loadUserProfiles();
  }, [ticket?.messages]);

  useEffect(() => {
    // Auto-scroll only if user hasn't manually scrolled or if there are new messages
    if (
      ticket?.messages &&
      !hasUserScrolled &&
      ticket.messages.length > previousMessageCount.current
    ) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
    previousMessageCount.current = ticket?.messages?.length || 0;
  }, [ticket?.messages, hasUserScrolled]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    setHasUserScrolled(!isAtBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasUserScrolled(false);
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
        userProfile.profileImage || DEFAULT_PROFILE_IMAGE,
        userProfile.memberRank,
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
    return <Loader text="Loading ticket..." />;
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

  const getRoleBadge = (senderRole: string, senderMemberRank?: string) => {
    // Priority 1: Check for staff roles
    switch (senderRole) {
      case "support":
        return {
          icon: "🛠️",
          label: "Support",
          color: "bg-blue-500/20 text-blue-400",
        };
      case "admin":
        return {
          icon: "👨‍💼",
          label: "Admin",
          color: "bg-purple-500/20 text-purple-400",
        };
      case "founder":
        return {
          icon: "👑",
          label: "Founder",
          color: "bg-yellow-500/20 text-yellow-400",
        };
      default:
        // Priority 2: Show member rank if not a staff member
        if (senderMemberRank && senderRole === "user") {
          const rankColor = getMemberRankColor(senderMemberRank);
          const rankLabel = getMemberRankLabel(senderMemberRank);
          return {
            icon: "⭐",
            label: rankLabel,
            color: rankColor,
          };
        }
        return {
          icon: "👤",
          label: "User",
          color: "bg-gray-500/20 text-gray-400",
        };
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
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="bg-secondary/30 border border-border rounded-lg p-4 space-y-4 h-96 overflow-y-auto flex flex-col"
          >
            {ticket.messages.map((msg) => {
              const roleBadge = getRoleBadge(msg.senderRole, msg.senderMemberRank);
              const isCurrentUser = msg.senderId === user?.uid;
              const profileImage =
                msg.senderProfileImage || DEFAULT_PROFILE_IMAGE;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isCurrentUser && (
                    <img
                      src={profileImage}
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                      }}
                    />
                  )}
                  <div
                    className={`max-w-xs space-y-1 ${
                      isCurrentUser ? "text-right" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isCurrentUser && (
                        <span className="text-xs font-medium text-foreground">
                          {msg.senderName}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadge.color}`}
                      >
                        {roleBadge.icon} {roleBadge.label}
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs font-medium text-foreground">
                          {msg.senderName}
                        </span>
                      )}
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : msg.senderRole !== "user"
                            ? "bg-blue-500/15 border border-blue-500/30 rounded-bl-none"
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
              );
            })}
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
