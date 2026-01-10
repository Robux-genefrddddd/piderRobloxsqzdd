import { useState } from "react";
import {
  X,
  AlertCircle,
  Clock,
  Check,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  createWarning,
  getUserWarnings,
  deleteWarning,
} from "@/lib/warningService";
import { updateUserProfile } from "@/lib/auth";
import { Warning } from "@/lib/warningService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface User {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  profileImage?: string;
  isBanned: boolean;
  createdAt: Date;
  memberRank?: string;
}

interface UserDetailModalProps {
  user: User | null;
  onClose: () => void;
  onAction?: () => void;
  currentUserRole?: string;
}

type ModerationStep = "select" | "warning" | "suspension" | "ban" | "history";
type ConfirmDialogType =
  | "warning"
  | "suspension"
  | "ban"
  | "deleteAccount"
  | null;

export function UserDetailModal({
  user,
  onClose,
  onAction,
  currentUserRole = "member",
}: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "moderation">("info");
  const [moderationStep, setModerationStep] =
    useState<ModerationStep>("select");
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [durationDays, setDurationDays] = useState("7");
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogType>(null);
  const [warningsLoaded, setWarningsLoaded] = useState(false);

  if (!user) return null;

  const handleLoadWarnings = async () => {
    try {
      const userWarnings = await getUserWarnings(user.uid);
      setWarnings(userWarnings);
      setWarningsLoaded(true);
    } catch (error) {
      console.error("Error loading warnings:", error);
      toast.error("Failed to load warning history");
    }
  };

  const handleCreateWarning = async (
    type: "warning" | "suspension" | "ban",
  ) => {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setLoading(true);
    try {
      const duration = type === "ban" ? undefined : parseInt(durationDays);
      await createWarning(
        user.uid,
        "admin-id",
        currentUserRole === "founder" ? "Founder" : "Admin",
        type,
        reason,
        `Issued by ${currentUserRole}`,
        duration,
      );

      toast.success(`${type} issued successfully`);
      setReason("");
      setDurationDays("7");
      setConfirmDialog(null);
      setModerationStep("select");

      // Reload warnings
      const userWarnings = await getUserWarnings(user.uid);
      setWarnings(userWarnings);

      if (onAction) onAction();
    } catch (error) {
      console.error("Error creating warning:", error);
      toast.error("Failed to issue action");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWarning = async (warningId: string) => {
    if (currentUserRole !== "founder") {
      toast.error("Only founders can delete warnings");
      return;
    }

    setLoading(true);
    try {
      await deleteWarning(warningId);
      toast.success("Warning deleted");

      // Reload warnings
      const userWarnings = await getUserWarnings(user.uid);
      setWarnings(userWarnings);
    } catch (error) {
      console.error("Error deleting warning:", error);
      toast.error("Failed to delete warning");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (
      (user.role === "founder" && currentUserRole !== "founder") ||
      (user.role === "admin" && currentUserRole === "member")
    ) {
      toast.error("Insufficient permissions to ban this user");
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(user.uid, { isBanned: true });
      toast.success("User banned successfully");
      setConfirmDialog(null);
      if (onAction) onAction();
      onClose();
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Failed to ban user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        isBanned: true,
        banReason: "Account deleted by admin",
      });

      toast.success("Account deleted successfully");
      setConfirmDialog(null);
      if (onAction) onAction();
      onClose();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  const canModerateUser =
    (user.role !== "founder" || currentUserRole === "founder") &&
    (user.role !== "admin" ||
      currentUserRole === "founder" ||
      currentUserRole === "admin");

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border/40 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Compact */}
        <div className="flex items-start justify-between p-4 border-b border-border/20">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={
                user.profileImage ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
              }
              alt={user.displayName}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">{user.displayName}</h2>
              <p className="text-xs text-muted-foreground truncate">
                @{user.username}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary/50 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs - Compact */}
        <div className="flex border-b border-border/20 px-4">
          <button
            onClick={() => {
              setActiveTab("info");
              setModerationStep("select");
            }}
            className={`py-2 text-xs font-medium border-b-2 transition-colors -mb-[1px] ${
              activeTab === "info"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Info
          </button>
          {canModerateUser && (
            <button
              onClick={() => {
                setActiveTab("moderation");
                handleLoadWarnings();
              }}
              className={`py-2 text-xs font-medium border-b-2 transition-colors -mb-[1px] ml-4 ${
                activeTab === "moderation"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Moderation
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "info" ? (
            <div className="p-4 space-y-4">
              {/* Quick Info */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Email
                  </p>
                  <p className="text-sm text-foreground">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Role
                  </p>
                  <p className="text-sm text-foreground capitalize">
                    {user.role}
                  </p>
                </div>
                {user.memberRank && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Rank
                    </p>
                    <p className="text-sm text-foreground capitalize">
                      {user.memberRank}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Member Since
                  </p>
                  <p className="text-sm text-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Status
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        user.isBanned ? "bg-yellow-600" : "bg-green-600"
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {user.isBanned ? "Banned" : "Active"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Moderation Flow */}
              {moderationStep === "select" ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    Choose moderation action
                  </p>

                  {/* Warning Action */}
                  <button
                    onClick={() => setModerationStep("warning")}
                    className="w-full p-3 bg-secondary/20 border border-border/30 rounded-lg hover:border-border/60 hover:bg-secondary/30 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Issue Warning</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          First notice for minor infractions
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-muted-foreground group-hover:text-foreground"
                      />
                    </div>
                  </button>

                  {/* Suspension Action */}
                  <button
                    onClick={() => setModerationStep("suspension")}
                    className="w-full p-3 bg-secondary/20 border border-border/30 rounded-lg hover:border-border/60 hover:bg-secondary/30 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Temporary Suspension
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Block access for a limited period
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-muted-foreground group-hover:text-foreground"
                      />
                    </div>
                  </button>

                  {/* Permanent Ban Action */}
                  <button
                    onClick={() => setModerationStep("ban")}
                    className="w-full p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg hover:border-yellow-500/60 hover:bg-yellow-500/15 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-700">
                          Permanent Ban
                        </p>
                        <p className="text-xs text-yellow-600/70 mt-0.5">
                          Irreversible action - requires confirmation
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-yellow-600 group-hover:text-yellow-700"
                      />
                    </div>
                  </button>

                  {/* History */}
                  {!warningsLoaded && (
                    <button
                      onClick={() => handleLoadWarnings()}
                      className="w-full p-3 bg-secondary/10 border border-border/30 rounded-lg hover:border-border/60 hover:bg-secondary/20 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">View History</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            See past warnings and actions
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-muted-foreground group-hover:text-foreground"
                        />
                      </div>
                    </button>
                  )}

                  {/* History Display */}
                  {warningsLoaded && warnings.length > 0 && (
                    <div className="pt-2 border-t border-border/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Moderation History
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {warnings.map((w) => (
                          <div
                            key={w.id}
                            className="p-2 bg-secondary/10 border border-border/30 rounded text-xs"
                          >
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize ${
                                  w.type === "ban"
                                    ? "bg-yellow-500/20 text-yellow-700"
                                    : w.type === "suspension"
                                      ? "bg-orange-500/20 text-orange-700"
                                      : "bg-blue-500/20 text-blue-700"
                                }`}
                              >
                                {w.type}
                              </span>
                              {currentUserRole === "founder" && (
                                <button
                                  onClick={() => handleDeleteWarning(w.id)}
                                  disabled={loading}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                            <p className="text-muted-foreground">{w.reason}</p>
                            <p className="text-muted-foreground/70 mt-1">
                              {new Date(w.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : moderationStep === "warning" ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setModerationStep("select")}
                    className="text-xs text-muted-foreground hover:text-foreground mb-2"
                  >
                    ← Back to actions
                  </button>

                  <div>
                    <label className="block text-xs font-medium mb-2">
                      Duration (days)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      placeholder="7"
                      className="text-sm h-8"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-2">
                      Reason
                    </label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain the reason for this warning..."
                      rows={3}
                      className="text-sm"
                    />
                  </div>

                  <Button
                    onClick={() => setConfirmDialog("warning")}
                    disabled={loading || !reason.trim()}
                    className="w-full text-sm"
                  >
                    Continue to Confirmation
                  </Button>
                </div>
              ) : moderationStep === "suspension" ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setModerationStep("select")}
                    className="text-xs text-muted-foreground hover:text-foreground mb-2"
                  >
                    ← Back to actions
                  </button>

                  <div>
                    <label className="block text-xs font-medium mb-2">
                      Suspension Duration (days)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      placeholder="7"
                      className="text-sm h-8"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-2">
                      Reason
                    </label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain the reason for this suspension..."
                      rows={3}
                      className="text-sm"
                    />
                  </div>

                  <Button
                    onClick={() => setConfirmDialog("suspension")}
                    disabled={loading || !reason.trim()}
                    className="w-full text-sm"
                  >
                    Continue to Confirmation
                  </Button>
                </div>
              ) : moderationStep === "ban" ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setModerationStep("select")}
                    className="text-xs text-muted-foreground hover:text-foreground mb-2"
                  >
                    ← Back to actions
                  </button>

                  <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-700">
                      <strong>Permanent ban</strong> is irreversible. Only
                      founders can delete this action.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-2">
                      Reason (required)
                    </label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain the reason for this ban..."
                      rows={3}
                      className="text-sm"
                    />
                  </div>

                  <Button
                    onClick={() => setConfirmDialog("ban")}
                    disabled={loading || !reason.trim()}
                    className="w-full text-sm bg-yellow-600 hover:bg-yellow-700"
                  >
                    Continue to Confirmation
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer - Action Menu */}
        {activeTab === "moderation" && canModerateUser && !user.isBanned && (
          <div className="border-t border-border/20 p-3 bg-card">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground flex-1">
                {moderationStep === "select"
                  ? "Select an action above"
                  : "Fill in the details and confirm"}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors">
                    <MoreVertical size={16} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => setConfirmDialog("deleteAccount")}
                    className="text-yellow-600"
                  >
                    Delete Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Confirmation Dialogs */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border/40 rounded-xl w-full max-w-sm shadow-2xl">
              <div className="p-4 border-b border-border/20">
                <h3 className="font-semibold text-sm">
                  Confirm{" "}
                  {confirmDialog === "deleteAccount"
                    ? "Account Deletion"
                    : confirmDialog}
                </h3>
              </div>

              <div className="p-4 space-y-3">
                {confirmDialog === "warning" && (
                  <>
                    <p className="text-sm text-foreground">
                      Issue a <strong>warning</strong> to {user.displayName} for{" "}
                      {durationDays} days?
                    </p>
                    <p className="text-xs text-muted-foreground bg-secondary/20 p-2 rounded border border-border/30">
                      Reason: {reason}
                    </p>
                  </>
                )}
                {confirmDialog === "suspension" && (
                  <>
                    <p className="text-sm text-foreground">
                      <strong>Suspend</strong> {user.displayName} for{" "}
                      {durationDays} days?
                    </p>
                    <p className="text-xs text-muted-foreground bg-secondary/20 p-2 rounded border border-border/30">
                      Reason: {reason}
                    </p>
                  </>
                )}
                {confirmDialog === "ban" && (
                  <>
                    <p className="text-sm text-yellow-700 font-medium">
                      Permanently ban {user.displayName}?
                    </p>
                    <p className="text-xs text-muted-foreground bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                      This action is irreversible. Only founders can delete this
                      ban.
                    </p>
                    <p className="text-xs text-muted-foreground bg-secondary/20 p-2 rounded border border-border/30">
                      Reason: {reason}
                    </p>
                  </>
                )}
                {confirmDialog === "deleteAccount" && (
                  <>
                    <p className="text-sm text-foreground">
                      Delete {user.displayName}'s account?
                    </p>
                    <p className="text-xs text-muted-foreground bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                      This action cannot be undone.
                    </p>
                  </>
                )}
              </div>

              <div className="border-t border-border/20 p-4 bg-card space-y-2">
                <Button
                  onClick={() => {
                    if (confirmDialog === "warning") {
                      handleCreateWarning("warning");
                    } else if (confirmDialog === "suspension") {
                      handleCreateWarning("suspension");
                    } else if (confirmDialog === "ban") {
                      handleBanUser();
                    } else if (confirmDialog === "deleteAccount") {
                      handleDeleteAccount();
                    }
                  }}
                  disabled={loading}
                  className="w-full text-sm"
                  variant={
                    confirmDialog === "ban" || confirmDialog === "deleteAccount"
                      ? "destructive"
                      : "default"
                  }
                >
                  {confirmDialog === "deleteAccount"
                    ? "Delete Account"
                    : "Confirm"}
                </Button>
                <Button
                  onClick={() => setConfirmDialog(null)}
                  variant="outline"
                  className="w-full text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
