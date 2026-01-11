import { useState } from "react";
import { useAcceptGroupInvite } from "@/hooks/useGroups";
import { useAuth } from "@/contexts/AuthContext";
import { GroupInvite } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Loader, Check, X } from "lucide-react";
import { toast } from "sonner";
import * as groupService from "@/lib/groupService";

interface GroupInviteMessageProps {
  invite: GroupInvite;
  onAccepted?: () => void;
  onDeclined?: () => void;
}

export default function GroupInviteMessage({
  invite,
  onAccepted,
  onDeclined,
}: GroupInviteMessageProps) {
  const { userProfile } = useAuth();
  const { acceptInvite, loading: accepting } = useAcceptGroupInvite();
  const [declining, setDeclining] = useState(false);

  const handleAccept = async () => {
    if (!userProfile) return;

    try {
      await acceptInvite(
        invite.id,
        invite.groupId,
        userProfile.uid,
        userProfile.username,
        userProfile.profileImage,
      );

      toast.success(`You have successfully joined ${invite.groupName}!`);
      if (onAccepted) {
        onAccepted();
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast.error("Failed to accept invite");
    }
  };

  const handleDecline = async () => {
    try {
      setDeclining(true);
      await groupService.declineGroupInvite(invite.id);
      toast.success("Invite declined");
      if (onDeclined) {
        onDeclined();
      }
    } catch (error) {
      console.error("Error declining invite:", error);
      toast.error("Failed to decline invite");
    } finally {
      setDeclining(false);
    }
  };

  return (
    <div className="group p-4 rounded-xl border border-white/5 bg-card/50 hover:bg-card/80 hover:border-white/10 transition-all cursor-default">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 flex-1 min-w-0">
          {/* Inviter Avatar */}
          <div className="flex-shrink-0">
            <img
              src={
                invite.inviterAvatar ||
                "https://tr.rbxcdn.com/180DAY-bd2c1a5fc86fd014cbbbaaafdd777643/420/420/Hat/Webp/noFilter"
              }
              alt={invite.inviterName}
              className="w-10 h-10 rounded-lg object-cover"
            />
          </div>

          {/* Invite Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground">
              <span className="text-primary">{invite.inviterName}</span> invited you to{" "}
              <span className="text-primary">{invite.groupName}</span>
            </h4>

            {invite.message && (
              <p className="text-sm text-foreground/70 mt-1 line-clamp-2">
                "{invite.message}"
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              {new Date(invite.invitationDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={accepting || declining}
            className="gap-1.5"
          >
            {accepting ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            <span className="hidden sm:inline">Join</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleDecline}
            disabled={accepting || declining}
            className="gap-1.5"
          >
            {declining ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <X size={14} />
            )}
            <span className="hidden sm:inline">Decline</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
