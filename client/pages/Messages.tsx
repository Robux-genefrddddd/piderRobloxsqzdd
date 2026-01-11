import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupInvites } from "@/hooks/useGroups";
import GroupInviteMessage from "@/components/groups/GroupInviteMessage";
import { Mail, Bell, Users, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  getUserBroadcastMessages,
  markBroadcastMessageAsRead,
  type BroadcastMessage,
} from "@/lib/broadcastService";
import { toast } from "sonner";

export default function Messages() {
  const navigate = useNavigate();
  const { userProfile, loading: authLoading, user } = useAuth();
  const { invites, loading } = useGroupInvites(userProfile?.uid);
  const [displayedInvites, setDisplayedInvites] = useState(invites);
  const [broadcastMessages, setBroadcastMessages] = useState<
    BroadcastMessage[]
  >([]);
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !userProfile) {
      navigate("/login");
    }
  }, [authLoading, userProfile, navigate]);

  useEffect(() => {
    setDisplayedInvites(invites);
  }, [invites]);

  // Load broadcast messages for the user
  useEffect(() => {
    if (userProfile?.uid) {
      loadBroadcastMessages();
    }
  }, [userProfile?.uid]);

  const loadBroadcastMessages = async () => {
    if (!userProfile?.uid) return;

    try {
      setBroadcastLoading(true);
      const messages = await getUserBroadcastMessages(userProfile.uid);
      setBroadcastMessages(messages);
    } catch (error) {
      console.error("Error loading broadcast messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handleInviteAccepted = () => {
    setDisplayedInvites(
      displayedInvites.filter((inv) => inv.status === "pending"),
    );
  };

  const handleInviteDeclined = () => {
    setDisplayedInvites(
      displayedInvites.filter((inv) => inv.status === "pending"),
    );
  };

  const handleMarkBroadcastAsRead = async (messageId: string) => {
    if (!user?.uid) return;

    try {
      await markBroadcastMessageAsRead(messageId, user.uid);
      // Update local state to reflect read status
      setBroadcastMessages(
        broadcastMessages.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                readBy: [...(msg.readBy || []), user.uid],
              }
            : msg,
        ),
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  if (authLoading || loading || broadcastLoading) {
    return <Loader text="Loading messages..." />;
  }

  const totalMessages = displayedInvites.length + broadcastMessages.length;

  return (
    <div className="bg-background flex flex-col">
      {/* Header - Fixed at top */}
      <div className="border-b border-border/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <Mail size={20} className="text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Messages</h1>
              <p className="text-muted-foreground text-xs mt-0.5">
                {totalMessages > 0
                  ? `${totalMessages} notification${totalMessages !== 1 ? "s" : ""}`
                  : "Group invitations and announcements"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {totalMessages === 0 ? (
            <div className="text-center py-8">
              <Mail
                size={32}
                className="text-muted-foreground mx-auto mb-3 opacity-50"
              />
              <h2 className="text-base font-semibold text-foreground mb-1">
                No messages yet
              </h2>
              <p className="text-xs text-muted-foreground">
                You haven't received any group invitations or announcements yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Broadcast Messages */}
              {broadcastMessages.map((message) => {
                const isRead = message.readBy?.includes(userProfile?.uid || "");
                return (
                  <div
                    key={message.id}
                    onClick={() => handleMarkBroadcastAsRead(message.id)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      isRead
                        ? "bg-card border-border/30 hover:border-border/50"
                        : "bg-primary/5 border-primary/30 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Bell
                          size={18}
                          className={
                            isRead ? "text-muted-foreground" : "text-primary"
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-sm font-semibold text-foreground break-words">
                            {message.title}
                          </h3>
                          {!isRead && (
                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium flex-shrink-0">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/80 mt-2 line-clamp-2 break-words">
                          {message.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          From {message.senderName} •{" "}
                          {new Date(message.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Group Invitations */}
              {displayedInvites.map((invite) => (
                <GroupInviteMessage
                  key={invite.id}
                  invite={invite}
                  onAccepted={handleInviteAccepted}
                  onDeclined={handleInviteDeclined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
