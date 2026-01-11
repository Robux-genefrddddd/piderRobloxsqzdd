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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Sticky at top */}
      <div className="border-b border-white/5 sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalMessages > 0
                  ? `${totalMessages} item${totalMessages !== 1 ? "s" : ""}`
                  : "Group invitations and announcements"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {totalMessages === 0 ? (
            // ✨ Empty State - Professional & Inviting
            <div className="flex items-center justify-center min-h-[500px]">
              <div className="w-full max-w-md">
                {/* Empty State Card */}
                <div className="bg-card border border-white/5 rounded-2xl p-8 text-center space-y-6">
                  {/* Icon Container */}
                  <div className="flex justify-center">
                    <div className="p-4 bg-primary/10 rounded-xl">
                      <Mail
                        size={40}
                        className="text-primary"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-foreground">
                      Your inbox is empty
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Group invitations, system messages, and announcements will appear here. Stay connected with the community.
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/5" />

                  {/* CTA Buttons */}
                  <div className="space-y-2 sm:space-y-0 sm:flex gap-3">
                    <Link to="/groups" className="flex-1">
                      <Button
                        variant="secondary"
                        size="default"
                        className="w-full"
                      >
                        <Users size={16} />
                        Explore Groups
                      </Button>
                    </Link>
                    <Link to="/groups" className="flex-1">
                      <Button
                        variant="ghost"
                        size="default"
                        className="w-full"
                      >
                        Create Group
                        <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </div>

                  {/* Help Text */}
                  <p className="text-xs text-muted-foreground/70">
                    💡 Tip: Join groups to receive invitations and updates from members.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Messages List - Future-proofed for two-column layout
            <div className="space-y-4">
              {/* Broadcast Messages Section */}
              {broadcastMessages.length > 0 && (
                <div className="space-y-3">
                  {/* Section Header */}
                  <div className="flex items-center gap-2 px-1">
                    <Bell size={16} className="text-primary" />
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Announcements
                    </h3>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  {/* Messages */}
                  {broadcastMessages.map((message) => {
                    const isRead = message.readBy?.includes(
                      userProfile?.uid || ""
                    );
                    return (
                      <div
                        key={message.id}
                        onClick={() => handleMarkBroadcastAsRead(message.id)}
                        className={`group p-4 rounded-xl border transition-all cursor-pointer ${
                          isRead
                            ? "bg-card/50 border-white/5 hover:bg-card/80 hover:border-white/10"
                            : "bg-primary/8 border-primary/30 hover:bg-primary/12 hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className="flex-shrink-0 mt-0.5 p-2 bg-white/5 rounded-lg group-hover:bg-white/8 transition-colors">
                            <Bell
                              size={16}
                              className={
                                isRead
                                  ? "text-muted-foreground"
                                  : "text-primary"
                              }
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                              <h4 className="text-sm font-semibold text-foreground break-words">
                                {message.title}
                              </h4>
                              {!isRead && (
                                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium flex-shrink-0">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground/70 line-clamp-2 break-words mb-2">
                              {message.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              From{" "}
                              <span className="font-medium text-foreground/80">
                                {message.senderName}
                              </span>{" "}
                              •{" "}
                              {new Date(
                                message.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Group Invitations Section */}
              {displayedInvites.length > 0 && (
                <div className="space-y-3">
                  {/* Section Header */}
                  <div className="flex items-center gap-2 px-1">
                    <Users size={16} className="text-primary" />
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Group Invitations
                    </h3>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  {/* Invitations */}
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
          )}
        </div>
      </div>
    </div>
  );
}
