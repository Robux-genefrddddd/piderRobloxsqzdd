import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/hooks/useGroups";
import GroupChat from "@/components/groups/GroupChat";
import GroupMembers from "@/components/groups/GroupMembers";
import { Loader, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile, loading: authLoading } = useAuth();
  const { group, loading } = useGroup(id);
  const [activeTab, setActiveTab] = useState<"chat" | "members">("chat");

  useEffect(() => {
    if (!authLoading && !userProfile) {
      navigate("/login");
    }
  }, [authLoading, userProfile, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Group not found</p>
        <Button onClick={() => navigate("/groups")}>Back to Groups</Button>
      </div>
    );
  }

  const isMember = group.members.some((m) => m.userId === userProfile?.uid);
  const isAdmin = group.members.some(
    (m) => m.userId === userProfile?.uid && m.role === "admin",
  );

  if (!isMember) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          You are not a member of this group
        </p>
        <Button onClick={() => navigate("/groups")}>Back to Groups</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Compact */}
      <div className="border-b border-border/30 bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate("/groups")}
                className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-foreground truncate">
                  {group.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {group.memberCount}{" "}
                  {group.memberCount === 1 ? "member" : "members"}
                </p>
              </div>
            </div>
            {group.description && (
              <p className="text-xs text-muted-foreground hidden sm:block max-w-xs text-right truncate">
                {group.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs - Compact */}
      <div className="border-b border-border/20 bg-background/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "chat"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "members"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Members
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content - Full Height */}
      <div className="flex-1 overflow-hidden max-w-6xl w-full mx-auto px-4 py-4">
        {activeTab === "chat" && (
          <div className="h-full">
            <GroupChat groupId={group.id} />
          </div>
        )}

        {activeTab === "members" && (
          <div className="overflow-y-auto">
            <GroupMembers group={group} isAdmin={isAdmin} />
          </div>
        )}
      </div>
    </div>
  );
}
