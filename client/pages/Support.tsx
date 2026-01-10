import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getUserTickets } from "@/lib/ticketService";
import { Ticket } from "@/lib/ticketService";
import { toast } from "sonner";

export default function Support() {
  const navigate = useNavigate();
  const { user, userProfile, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    loadTickets();
  }, [isAuthenticated, user, navigate]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      if (user?.uid) {
        const userTickets = await getUserTickets(user.uid);
        setTickets(userTickets);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Support Center</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Need help? Create a ticket
            </p>
          </div>
          <Link to="/support/new">
            <Button>Create Ticket</Button>
          </Link>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-secondary/30 border border-border rounded-lg p-12 text-center space-y-4">
              <MessageSquare
                size={48}
                className="mx-auto text-muted-foreground"
              />
              <div>
                <p className="text-lg font-semibold text-foreground mb-2">
                  No support tickets yet
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  If you need help, create a new support ticket and our team
                  will assist you shortly.
                </p>
              </div>
              <Link to="/support/new">
                <Button>
                  <Plus size={16} className="mr-2" />
                  Create Your First Ticket
                </Button>
              </Link>
            </div>
          ) : (
            tickets.map((ticket) => (
              <Link key={ticket.id} to={`/support/ticket/${ticket.id}`}>
                <div className="bg-secondary/30 border border-border rounded-lg p-4 hover:border-border/80 hover:bg-secondary/40 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {ticket.subject}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${getStatusColor(
                            ticket.status,
                          )}`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="capitalize">
                          Category:{" "}
                          <span className="text-foreground">
                            {ticket.category.replace("-", " ")}
                          </span>
                        </span>
                        <span
                          className={`capitalize font-semibold ${getPriorityColor(ticket.priority)}`}
                        >
                          Priority: {ticket.priority}
                        </span>
                        <span>
                          {ticket.messages.length} message
                          {ticket.messages.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {ticket.createdAt.toLocaleDateString()}
                      </p>
                      {ticket.assignedToName && (
                        <p className="text-xs text-primary mt-1">
                          Assigned to {ticket.assignedToName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
