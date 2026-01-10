import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  TrendingUp,
  Download,
  DollarSign,
  Star,
  MoreVertical,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { getUserAssets, Asset } from "@/lib/assetService";
import { logoutUser } from "@/lib/auth";
import { WarningsSection } from "@/components/WarningsSection";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "assets" | "warnings"
  >("overview");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Fetch user's assets from Firebase
    const fetchAssets = async () => {
      if (user?.uid) {
        const userAssets = await getUserAssets(user.uid);
        setAssets(userAssets);
      }
      setLoading(false);
    };

    fetchAssets();
  }, [isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Calculate stats from real assets
  const stats = {
    totalEarnings: assets.reduce(
      (sum, asset) => sum + (asset.price || 0) * asset.downloads,
      0,
    ),
    totalDownloads: assets.reduce((sum, asset) => sum + asset.downloads, 0),
    totalAssets: assets.length,
    avgRating:
      assets.length > 0
        ? (
            assets.reduce((sum, asset) => sum + asset.rating, 0) / assets.length
          ).toFixed(2)
        : 0,
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-sm text-muted-foreground/80">
              Welcome back, {userProfile?.displayName || "Creator"}! Manage your
              assets and track your success.
            </p>
          </div>
          <Link to="/upload">
            <Button size="sm" className="gap-2">
              <UploadIcon size={16} />
              Upload
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/5 overflow-x-auto">
          {[
            { id: "overview", label: "Overview" },
            { id: "assets", label: "My Assets" },
            { id: "warnings", label: "Warnings & Bans", icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-4 px-1 text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground/80 hover:text-foreground"
              }`}
            >
              {tab.icon && <tab.icon size={16} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-white/5 rounded-lg p-4 space-y-2 bg-white/2 hover:border-white/10 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Total Earnings
                  </h3>
                  <div className="w-6 h-6 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                    <DollarSign size={14} />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">
                    ${stats.totalEarnings.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    From assets
                  </p>
                </div>
              </div>

              <div className="bg-secondary/50 border border-border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Total Downloads
                  </h3>
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Download size={14} />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">
                    {stats.totalDownloads.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Downloads
                  </p>
                </div>
              </div>

              <div className="bg-secondary/50 border border-border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Published Assets
                  </h3>
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <TrendingUp size={14} />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">
                    {stats.totalAssets}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Published
                  </p>
                </div>
              </div>

              <div className="bg-secondary/50 border border-border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Avg. Rating
                  </h3>
                  <div className="w-6 h-6 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                    <Star size={14} />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">
                    {stats.avgRating}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Rating</p>
                </div>
              </div>
            </div>

            {/* Recent Assets */}
            <div className="bg-secondary/30 border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-xs text-foreground">
                  {assets.length === 0 ? "No Assets Yet" : "Your Recent Assets"}
                </h3>
              </div>

              {assets.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    You haven't uploaded any assets yet.
                  </p>
                  <Link to="/upload">
                    <Button size="sm" className="text-xs">
                      <UploadIcon size={12} className="mr-1" />
                      Upload Asset
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {assets.slice(0, 5).map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {asset.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {asset.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-xs font-medium text-foreground">
                            {asset.downloads}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${(asset.price || 0).toFixed(2)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 hover:bg-secondary rounded transition-colors">
                              <MoreVertical size={12} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/asset/${asset.id}`}>View Asset</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              Edit (Coming Soon)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === "assets" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {assets.length} published{" "}
                {assets.length === 1 ? "asset" : "assets"}
              </p>
              <Link to="/upload">
                <Button size="sm" className="text-xs">
                  <UploadIcon size={12} />
                  New
                </Button>
              </Link>
            </div>

            {assets.length === 0 ? (
              <div className="bg-secondary/30 border border-border rounded-lg p-6 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  You haven't uploaded any assets yet.
                </p>
                <Link to="/upload">
                  <Button size="sm" className="text-xs">
                    <UploadIcon size={12} className="mr-1" />
                    Upload Asset
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="bg-secondary/30 border border-border rounded-lg p-3 hover:border-border/80 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1">
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground">
                            {asset.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {asset.category}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {asset.description}
                          </p>
                          <div className="flex gap-3 mt-1 text-xs">
                            <div>
                              <p className="text-muted-foreground">Downloads</p>
                              <p className="font-semibold text-foreground">
                                {asset.downloads}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Price</p>
                              <p className="font-semibold text-foreground">
                                ${(asset.price || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Rating</p>
                              <p className="font-semibold text-foreground">
                                {asset.rating}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${
                            asset.status === "published"
                              ? "bg-green-500/20 text-green-400"
                              : asset.status === "verification"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : asset.status === "uploading"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {asset.status === "published"
                            ? "Published"
                            : asset.status === "verification"
                              ? "Verifying"
                              : asset.status === "uploading"
                                ? "Uploading"
                                : "Draft"}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem asChild>
                              <Link to={`/asset/${asset.id}`}>
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              Edit (Coming Soon)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Warnings Tab */}
        {activeTab === "warnings" && (
          <div className="space-y-3">
            <div className="bg-secondary/30 border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-yellow-400" />
                <div>
                  <h3 className="font-semibold text-xs text-foreground">
                    Your Warnings & Bans
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    View your account status and any active warnings
                  </p>
                </div>
              </div>
              {user && <WarningsSection userId={user.uid} canDelete={false} />}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="mt-6 pt-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
