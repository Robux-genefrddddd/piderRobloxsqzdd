import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Shield,
  Clock,
  AlertCircle,
  AlertTriangle,
  X,
  Mail,
  Settings,
  ChevronRight,
  Activity,
  Toggle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { logoutUser } from "@/lib/auth";
import { logAction, getAuditLogs } from "@/lib/auditService";
import {
  getMaintenanceStatus,
  setMaintenanceMode,
  subscribeToMaintenanceStatus,
  MaintenanceStatus,
} from "@/lib/maintenanceService";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { UserDetailModal } from "@/components/UserDetailModal";
import { BroadcastMessageModal } from "@/components/BroadcastMessageModal";
import {
  getAllBroadcastMessages,
  deleteBroadcastMessage,
} from "@/lib/broadcastService";

interface User {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  profileImage?: string;
  isBanned: boolean;
  banReason?: string;
  createdAt: Date;
  memberRank?: string;
}

interface AuditLog {
  id: string;
  action: string;
  performedByName: string;
  targetUserName?: string;
  reason?: string;
  timestamp: Date;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "users" | "logs" | "maintenance" | "messages"
  >("users");
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [maintenanceStatus, setMaintenanceStatus] =
    useState<MaintenanceStatus | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [updatingMaintenance, setUpdatingMaintenance] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessages, setBroadcastMessages] = useState<any[]>([]);

  // Check authorization and load maintenance status
  useEffect(() => {
    if (!user || !userProfile) {
      navigate("/login");
      return;
    }

    if (userProfile.role !== "founder" && userProfile.role !== "admin") {
      navigate("/");
      return;
    }

    loadData();

    // Subscribe to maintenance status (real-time updates)
    const unsubscribe = subscribeToMaintenanceStatus((status) => {
      setMaintenanceStatus(status);
      setMaintenanceMessage(status.message || "");
    });

    return unsubscribe;
  }, [user, userProfile, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const allUsers: User[] = usersSnapshot.docs.map((doc) => ({
        uid: doc.id,
        username: doc.data().username,
        displayName: doc.data().displayName,
        email: doc.data().email,
        role: doc.data().role,
        profileImage: doc.data().profileImage,
        isBanned: doc.data().isBanned || false,
        banReason: doc.data().banReason,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        memberRank: doc.data().memberRank,
      }));

      setUsers(allUsers);

      // Fetch audit logs
      const logs = await getAuditLogs();
      setAuditLogs(logs as AuditLog[]);

      // Fetch broadcast messages (founder only)
      if (userProfile?.role === "founder") {
        const messages = await getAllBroadcastMessages();
        setBroadcastMessages(messages);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async () => {
    // Reload data after user action
    await loadData();
  };

  const handleMaintenanceModeChange = async () => {
    if (userProfile?.role !== "founder") {
      toast.error("Only founders can change maintenance mode");
      return;
    }

    setUpdatingMaintenance(true);
    try {
      const newStatus = !maintenanceStatus?.enabled;
      await setMaintenanceMode(
        newStatus,
        maintenanceMessage,
        userProfile.displayName,
      );
      toast.success(`Maintenance mode ${newStatus ? "enabled" : "disabled"}`);
      setShowMaintenanceModal(false);
    } catch (error) {
      console.error("Error updating maintenance mode:", error);
      toast.error("Failed to update maintenance mode");
    } finally {
      setUpdatingMaintenance(false);
    }
  };

  const handleDeleteBroadcastMessage = async (messageId: string) => {
    try {
      await deleteBroadcastMessage(messageId);
      setBroadcastMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (
    !userProfile ||
    (userProfile.role !== "founder" && userProfile.role !== "admin")
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this panel
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={18} className="text-primary" />
              <h1 className="text-lg font-bold">Admin Panel</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Manage users, monitor activity, and system settings
            </p>
          </div>
        </div>

        {/* Maintenance Status Alert - Compact */}
        {maintenanceStatus?.enabled && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1">
              <AlertTriangle
                size={16}
                className="text-yellow-600 mt-0.5 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-yellow-600">
                  Maintenance Mode Active
                </p>
                {maintenanceStatus.message && (
                  <p className="text-xs text-yellow-600/70 mt-0.5">
                    {maintenanceStatus.message}
                  </p>
                )}
              </div>
            </div>
            {userProfile?.role === "founder" && (
              <Button
                onClick={() => setShowMaintenanceModal(true)}
                variant="outline"
                size="sm"
                className="flex-shrink-0 text-xs"
              >
                Manage
              </Button>
            )}
          </div>
        )}

        {/* Stats - Compact Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-card border border-border/30 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">
                  Total Users
                </p>
                <p className="text-2xl font-bold mt-1">{users.length}</p>
              </div>
              <Users size={16} className="text-primary flex-shrink-0 mt-0.5" />
            </div>
          </div>

          <div className="p-3 bg-card border border-border/30 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">
                  Banned
                </p>
                <p className="text-2xl font-bold mt-1">
                  {users.filter((u) => u.isBanned).length}
                </p>
              </div>
              <AlertTriangle
                size={16}
                className="text-yellow-600 flex-shrink-0 mt-0.5"
              />
            </div>
          </div>

          <div className="p-3 bg-card border border-border/30 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">
                  Logged Actions
                </p>
                <p className="text-2xl font-bold mt-1">{auditLogs.length}</p>
              </div>
              <Activity
                size={16}
                className="text-primary/70 flex-shrink-0 mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Tabs - Reduced Height */}
        <div className="flex gap-0 mb-4 border-b border-border/20 overflow-x-auto">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Users{" "}
            {users.length > 0 && (
              <span className="text-xs ml-1">({users.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "logs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Audit Logs{" "}
            {auditLogs.length > 0 && (
              <span className="text-xs ml-1">({auditLogs.length})</span>
            )}
          </button>
          {userProfile?.role === "founder" && (
            <>
              <button
                onClick={() => setActiveTab("messages")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "messages"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Messages{" "}
                {broadcastMessages.length > 0 && (
                  <span className="text-xs ml-1">
                    ({broadcastMessages.length})
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("maintenance")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "maintenance"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Settings
              </button>
            </>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Loading admin data...
              </p>
            </div>
          </div>
        ) : activeTab === "users" ? (
          <div className="space-y-4">
            {/* Search - Smaller */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 py-2 text-sm h-9"
              />
            </div>

            {/* Users List - Compact Items */}
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle
                    size={32}
                    className="mx-auto text-muted-foreground mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    No users found
                  </p>
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.uid}
                    onClick={() => setSelectedUser(u)}
                    className="p-3 bg-card border border-border/30 rounded-lg hover:border-border/60 hover:bg-card/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <img
                        src={
                          u.profileImage ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`
                        }
                        alt={u.displayName}
                        className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {u.displayName}
                          </h3>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            @{u.username}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="px-1.5 py-0.5 bg-primary/15 text-primary text-xs rounded font-medium capitalize">
                            {u.role}
                          </span>
                          {u.memberRank && (
                            <span className="px-1.5 py-0.5 bg-secondary/50 text-secondary-foreground text-xs rounded font-medium capitalize">
                              {u.memberRank}
                            </span>
                          )}
                          {u.isBanned && (
                            <span className="px-1.5 py-0.5 bg-yellow-500/15 text-yellow-700 text-xs rounded font-medium">
                              BANNED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Indicator */}
                      <ChevronRight
                        size={16}
                        className="text-muted-foreground group-hover:text-primary flex-shrink-0"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === "messages" && userProfile?.role === "founder" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Broadcast Messages</h3>
              <Button
                onClick={() => setShowBroadcastModal(true)}
                size="sm"
                className="gap-2 text-sm"
              >
                <Mail size={14} />
                Send Message
              </Button>
            </div>

            {broadcastMessages.length === 0 ? (
              <div className="text-center py-8">
                <Mail
                  size={32}
                  className="mx-auto text-muted-foreground mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  No messages sent yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {broadcastMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 bg-card border border-border/30 rounded-lg hover:border-border/60 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {msg.title}
                        </p>
                        <p className="text-xs text-foreground/70 mt-1 line-clamp-2">
                          {msg.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>
                            {msg.recipientType === "all"
                              ? `All ${users.length}`
                              : `${msg.recipientIds?.length || 0}`}{" "}
                            users
                          </span>
                          <span>
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBroadcastMessage(msg.id)}
                        className="p-1.5 hover:bg-yellow-500/15 rounded transition-colors flex-shrink-0"
                      >
                        <X size={14} className="text-yellow-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "maintenance" && userProfile?.role === "founder" ? (
          <div className="space-y-4 max-w-md">
            <div className="p-4 bg-card border border-border/30 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Temporarily disable site access for maintenance
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/20 border border-border/30 rounded-lg mb-3">
                <div className="text-sm font-medium">
                  Status:{" "}
                  <span
                    className={
                      maintenanceStatus?.enabled
                        ? "text-yellow-600"
                        : "text-green-600"
                    }
                  >
                    {maintenanceStatus?.enabled ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setShowMaintenanceModal(true)}
                className="w-full text-sm"
                variant={maintenanceStatus?.enabled ? "destructive" : "default"}
              >
                {maintenanceStatus?.enabled
                  ? "Disable Maintenance"
                  : "Enable Maintenance"}
              </Button>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-600/90">
                When enabled, visitors will see a maintenance page. No users
                will be able to access the site.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <div className="text-center py-12">
                <Clock
                  size={32}
                  className="mx-auto text-muted-foreground mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  No audit logs yet
                </p>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-card border border-border/30 rounded-lg hover:border-border/60 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        By{" "}
                        <span className="font-medium text-foreground">
                          {log.performedByName}
                        </span>
                        {log.targetUserName && (
                          <>
                            {" "}
                            <span className="text-muted-foreground">
                              →
                            </span>{" "}
                            <span className="font-medium text-foreground">
                              {log.targetUserName}
                            </span>
                          </>
                        )}
                      </p>
                      {log.reason && (
                        <p className="text-xs text-muted-foreground/80 mt-1">
                          {log.reason}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 text-right">
                      <div>{log.timestamp.toLocaleDateString()}</div>
                      <div>
                        {log.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Maintenance Mode Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/40 rounded-xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              <h2 className="text-base font-bold">
                {maintenanceStatus?.enabled
                  ? "Disable Maintenance"
                  : "Enable Maintenance"}
              </h2>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="p-1 hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {!maintenanceStatus?.enabled && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-2">
                      Maintenance Message (optional)
                    </label>
                    <Textarea
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="We're performing maintenance. We'll be back soon!"
                      rows={3}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This message will be shown to visitors.
                    </p>
                  </div>

                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-600/90">
                      When enabled, all site access will be blocked with a
                      maintenance notice.
                    </p>
                  </div>
                </>
              )}

              {maintenanceStatus?.enabled && (
                <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-600/90">
                    Disabling maintenance mode will immediately restore site
                    access to all users.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/20 p-4 bg-card space-y-2">
              <Button
                onClick={handleMaintenanceModeChange}
                disabled={updatingMaintenance}
                className="w-full text-sm"
                variant={maintenanceStatus?.enabled ? "destructive" : "default"}
              >
                {maintenanceStatus?.enabled
                  ? "Disable Maintenance"
                  : "Enable Maintenance"}
              </Button>
              <Button
                onClick={() => setShowMaintenanceModal(false)}
                variant="outline"
                className="w-full text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onAction={handleUserAction}
        currentUserRole={userProfile?.role}
      />

      {/* Broadcast Modal */}
      <BroadcastMessageModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        onSuccess={() => {
          loadData();
          setShowBroadcastModal(false);
        }}
      />
    </div>
  );
}
