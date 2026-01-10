import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserGroups } from "@/hooks/useGroups";
import CreateGroupDialog from "@/components/groups/CreateGroupDialog";
import GroupCard from "@/components/groups/GroupCard";
import { Loader } from "lucide-react";

export default function Groups() {
  const navigate = useNavigate();
  const { userProfile, loading: authLoading } = useAuth();
  const { groups, loading } = useUserGroups(userProfile?.uid);

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

  const canCreateGroup =
    userProfile?.role === "partner" || userProfile?.role === "admin";

  return (
    <div className="bg-background flex flex-col">
      {/* Header - Compact */}
      <div className="border-b border-border/30 bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">My Groups</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Collaborate and connect
              </p>
            </div>
            {canCreateGroup && <CreateGroupDialog />}
          </div>
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {groups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {canCreateGroup
                  ? "No groups yet. Create one to get started!"
                  : "You haven't been invited to any groups yet."}
              </p>
              {canCreateGroup && (
                <CreateGroupDialog
                  onGroupCreated={(groupId) => navigate(`/groups/${groupId}`)}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onClick={() => navigate(`/groups/${group.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
