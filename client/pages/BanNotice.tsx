import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Calendar, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { logoutUser } from "@/lib/auth";
import { getUserWarnings, Warning } from "@/lib/warningService";

export default function BanNotice() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [warning, setWarning] = useState<Warning | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBanInfo = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const warnings = await getUserWarnings(user.uid);
        const activeWarning = warnings.find(
          (w) => (w.type === "ban" || w.type === "suspension") && w.isActive,
        );
        if (activeWarning) {
          setWarning(activeWarning);
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error loading ban info:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    loadBanInfo();
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
          <p className="text-gray-400 text-sm">Loading account information...</p>
        </div>
      </div>
    );
  }

  if (!warning) {
    if (!user) {
      navigate("/login");
    } else {
      navigate("/");
    }
    return null;
  }

  const isBan = warning.type === "ban";
  const isSuspension = warning.type === "suspension";

  const canReactivateDate = warning.expiresAt
    ? new Date(warning.expiresAt).toLocaleString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      })
    : null;

  const reviewDate = new Date(warning.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Main Card */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-8 space-y-6 backdrop-blur-sm">
          {/* Title */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {isBan ? (
                <div className="p-3 bg-red-950/50 rounded-lg">
                  <AlertTriangle size={28} className="text-red-600" />
                </div>
              ) : (
                <div className="p-3 bg-yellow-950/50 rounded-lg">
                  <AlertTriangle size={28} className="text-yellow-600" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {isBan
                    ? "Permanently Banned"
                    : isSuspension
                      ? `Suspended${warning.expiresAt ? " for " + Math.ceil((new Date(warning.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + " Days" : ""}`
                      : "Account Warning"}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Account Status: {isBan ? "Permanently Disabled" : "Temporarily Suspended"}
                </p>
              </div>
            </div>
          </div>

          {/* Violation Details */}
          <div className="border-t border-gray-700 pt-6 space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Reason
              </p>
              <p className="text-gray-100 text-sm leading-relaxed">{warning.reason}</p>
            </div>

            {warning.details && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Details
                </p>
                <div className="bg-gray-900/80 border border-gray-700 rounded p-4">
                  <p className="text-gray-300 text-xs leading-relaxed break-words">
                    {warning.details}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Review Information */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Reviewed
                </p>
                <p className="text-sm text-gray-100">{reviewDate}</p>
              </div>
            </div>

            {warning.adminName && (
              <div className="pt-3 border-t border-gray-700">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Moderator
                </p>
                <p className="text-sm text-gray-100">{warning.adminName}</p>
              </div>
            )}
          </div>

          {/* Reactivation Information */}
          {isSuspension && canReactivateDate ? (
            <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border border-yellow-700/40 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">
                    Account Reactivation Date
                  </p>
                  <p className="text-sm text-yellow-200">{canReactivateDate}</p>
                </div>
              </div>
            </div>
          ) : isBan ? (
            <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-700/40 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
                    Permanent Ban
                  </p>
                  <p className="text-sm text-red-200">
                    Your account has been permanently banned. You cannot access
                    this platform or create new accounts.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Appeal Section */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Need Help?
                </p>
                <p className="text-sm text-gray-300">
                  If you believe this decision was made in error, please contact
                  our support team to submit an appeal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleLogout}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 transition-all duration-200"
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
        </div>

        {/* Footer Info */}
        <p className="text-center text-xs text-gray-600 px-4 leading-relaxed">
          If you have questions about this action or would like to appeal, please
          contact our support team at support@example.com
        </p>
      </div>
    </div>
  );
}
