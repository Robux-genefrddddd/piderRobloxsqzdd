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
  const [activeTab, setActiveTab] = useState<"overview" | "assets" | "warnings">(
    "overview",
  );
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
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {userProfile?.displayName || "Creator"}! Manage your
              assets and track your success.
            </p>
          </div>
          <Link to="/upload">
            <Button size="sm" className="gap-2">
              <UploadIcon size={18} />
              Upload Asset
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          {[
            { id: "overview", label: "Overview" },
            { id: "assets", label: "My Assets" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Total Earnings
                  </h3>
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ${stats.totalEarnings.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    From your published assets
                  </p>
                </div>
              </div>

              <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Total Downloads
                  </h3>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Download size={16} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalDownloads.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-400 mt-1">
                    Total asset downloads
                  </p>
                </div>
              </div>

              <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Published Assets
                  </h3>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalAssets}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active on marketplace
                  </p>
                </div>
              </div>

              <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Avg. Rating
                  </h3>
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                    <Star size={16} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.avgRating}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average from reviews
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Assets */}
            <div className="bg-secondary/30 border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-foreground">
                  {assets.length === 0 ? "No Assets Yet" : "Your Recent Assets"}
                </h3>
              </div>

              {assets.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You haven't uploaded any assets yet.
                  </p>
                  <Link to="/upload">
                    <Button size="sm">
                      <UploadIcon size={14} className="mr-2" />
                      Upload Your First Asset
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {assets.slice(0, 5).map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {asset.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {asset.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-medium text-foreground">
                            {asset.downloads} downloads
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${(asset.price || 0).toFixed(2)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 hover:bg-secondary rounded transition-colors">
                              <MoreVertical size={14} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/asset/${asset.id}`}>View Asset</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              Edit Asset (Coming Soon)
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
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                You have {assets.length} published{" "}
                {assets.length === 1 ? "asset" : "assets"}
              </p>
              <Link to="/upload">
                <Button size="sm">
                  <UploadIcon size={14} />
                  New Asset
                </Button>
              </Link>
            </div>

            {assets.length === 0 ? (
              <div className="bg-secondary/30 border border-border rounded-lg p-8 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  You haven't uploaded any assets yet.
                </p>
                <Link to="/upload">
                  <Button size="sm">
                    <UploadIcon size={14} className="mr-2" />
                    Upload Your First Asset
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="bg-secondary/30 border border-border rounded-lg p-4 hover:border-border/80 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-16 h-16 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-foreground">
                            {asset.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {asset.category}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {asset.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs">
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
                                ⭐ {asset.rating}
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

        {/* Logout Button */}
        <div className="mt-8 pt-6 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
