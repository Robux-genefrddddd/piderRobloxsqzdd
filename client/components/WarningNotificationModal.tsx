import { useEffect, useState } from "react";
import { AlertTriangle, Ban, Clock, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToUserWarnings,
  Warning,
  acknowledgeWarning,
} from "@/lib/warningService";
import { toast } from "sonner";

export function WarningNotificationModal() {
  const { user, userProfile } = useAuth();
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [displayedWarningId, setDisplayedWarningId] = useState<string | null>(
    null,
  );
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    if (!user || !userProfile) return;

    // Subscribe to real-time warning updates
    const unsubscribe = subscribeToUserWarnings(user.uid, (newWarnings) => {
      setWarnings(newWarnings);

      // Auto-select the most relevant warning to display
      // Priority: unacknowledged warnings > active suspensions/bans
      const unacknowledgedWarning = newWarnings.find(
        (w) => w.type === "warning" && !w.acknowledgedAt,
      );

      const activeAction = newWarnings.find((w) => {
        // Ban is always active unless we explicitly remove it
        if (w.type === "ban") return true;
        // Suspension/temp ban: check if still within duration
        if (w.expiresAt) {
          return new Date() < new Date(w.expiresAt);
        }
        return true;
      });

      // Show unacknowledged warning first, then any active action
      const toDisplay = unacknowledgedWarning || activeAction;
      setDisplayedWarningId(toDisplay?.id || null);
    });

    return unsubscribe;
  }, [user, userProfile]);

  const currentWarning = warnings.find((w) => w.id === displayedWarningId);

  if (!currentWarning) return null;

  const isWarning = currentWarning.type === "warning";
  const isSuspension = currentWarning.type === "suspension";
  const isBan = currentWarning.type === "ban";
  const isTemporary = currentWarning.expiresAt !== undefined;
  const isExpired =
    currentWarning.expiresAt &&
    new Date() >= new Date(currentWarning.expiresAt);

  // Don't show expired temporary actions
  if (isExpired && !isBan) {
    return null;
  }

  const handleAcknowledge = async () => {
    if (!isWarning) return;

    setAcknowledging(true);
    try {
      await acknowledgeWarning(currentWarning.id);
      toast.success("Warning acknowledged");
      // Auto-select next warning or action
      const remaining = warnings.filter((w) => w.id !== currentWarning.id);
      const next =
        remaining.find((w) => w.type === "warning" && !w.acknowledgedAt) ||
        remaining.find((w) => {
          if (w.type === "ban") return true;
          if (w.expiresAt && new Date() < new Date(w.expiresAt)) return true;
          return false;
        });
      setDisplayedWarningId(next?.id || null);
    } catch (error) {
      console.error("Error acknowledging warning:", error);
      toast.error("Failed to acknowledge warning");
    } finally {
      setAcknowledging(false);
    }
  };

  const handleDismiss = () => {
    // For non-warning modals, just move to next one
    const remaining = warnings.filter((w) => w.id !== currentWarning.id);
    const next =
      remaining.find((w) => w.type === "warning" && !w.acknowledgedAt) ||
      remaining.find((w) => {
        if (w.type === "ban") return true;
        if (w.expiresAt && new Date() < new Date(w.expiresAt)) return true;
        return false;
      });
    setDisplayedWarningId(next?.id || null);
  };

  const getIcon = () => {
    if (isBan) {
      return <Ban size={24} className="text-red-600" />;
    } else if (isSuspension) {
      return <Clock size={24} className="text-orange-600" />;
    } else {
      return <AlertTriangle size={24} className="text-blue-600" />;
    }
  };

  const getIconBg = () => {
    if (isBan) return "bg-red-500/15";
    if (isSuspension) return "bg-orange-500/15";
    return "bg-blue-500/15";
  };

  const getActionTitle = () => {
    if (isBan) return "Permanent Ban";
    if (isSuspension && isTemporary) return "Temporary Suspension";
    if (isSuspension) return "Suspension";
    return "Warning";
  };

  const getDateLabel = () => {
    if (isBan) return "Issued";
    if (isSuspension && isTemporary) return "Expires";
    return "Issued";
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDurationText = () => {
    if (!currentWarning.expiresAt) return null;
    const now = new Date();
    const expiry = new Date(currentWarning.expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "Expires tomorrow";
    return `Expires in ${diffDays} days`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="w-full max-w-md bg-card border border-border/40 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border/20">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`p-3 rounded-lg ${getIconBg()} flex-shrink-0`}>
              {getIcon()}
            </div>

            {/* Title & Meta */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground">
                {getActionTitle()}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Issued by {currentWarning.adminName}
              </p>
            </div>

            {/* Close button (informational modals only) */}
            {!isWarning && (
              <button
                onClick={handleDismiss}
                className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Reason Section */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Reason
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {currentWarning.reason}
            </p>
          </div>

          {/* Details Section (if present) */}
          {currentWarning.details && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Details
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {currentWarning.details}
              </p>
            </div>
          )}

          {/* Dates Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-xs">
              <Clock
                size={14}
                className="text-muted-foreground flex-shrink-0"
              />
              <span className="text-muted-foreground font-medium">
                {getDateLabel()}:
              </span>
              <span className="text-foreground">
                {formatDate(currentWarning.createdAt)}
              </span>
            </div>

            {/* Expiration info for temporary actions */}
            {isTemporary && !isBan && (
              <div className="flex items-center gap-2 text-xs">
                <Clock
                  size={14}
                  className="text-muted-foreground flex-shrink-0"
                />
                <span className="text-muted-foreground font-medium">
                  Expires:
                </span>
                <span className="text-foreground">
                  {formatDate(currentWarning.expiresAt!)}
                </span>
              </div>
            )}
          </div>

          {/* Ban Notice */}
          {isBan && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-700 leading-relaxed">
                <strong>Your account has been permanently banned.</strong> You
                cannot access your account or create new accounts. Contact
                support if you believe this is an error.
              </p>
            </div>
          )}

          {/* Suspension Notice */}
          {isSuspension && isTemporary && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-xs text-orange-700 leading-relaxed">
                <strong>Your account is temporarily suspended.</strong>{" "}
                {getDurationText()}. You will regain access when the suspension
                expires.
              </p>
            </div>
          )}

          {/* Warning Notice */}
          {isWarning && !currentWarning.acknowledgedAt && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-700 leading-relaxed">
                This is a notice about your account activity. Please review the
                reason above and ensure compliance with our community
                guidelines.
              </p>
            </div>
          )}

          {/* Acknowledged state */}
          {isWarning && currentWarning.acknowledgedAt && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
              <CheckCircle
                size={14}
                className="text-green-700 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-green-700">
                You acknowledged this warning on{" "}
                {formatDate(currentWarning.acknowledgedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border/20 p-5 bg-card">
          {isWarning && !currentWarning.acknowledgedAt ? (
            <Button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="w-full text-sm"
            >
              I Understand
            </Button>
          ) : isWarning && currentWarning.acknowledgedAt ? (
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="w-full text-sm"
            >
              Dismiss
            </Button>
          ) : (
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="w-full text-sm"
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
