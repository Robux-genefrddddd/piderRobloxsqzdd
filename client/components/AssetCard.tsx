import { Link } from "react-router-dom";
import { Star, Download, Lock } from "lucide-react";
import type { Asset } from "@/lib/assetService";

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const isFree = asset.price === null || asset.price === 0;

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Navigate to asset detail page where preview modal will open
    window.location.href = `/asset/${asset.id}?preview=true`;
  };

  return (
    <Link to={`/asset/${asset.id}`}>
      <div className="group h-full">
        <div className="overflow-hidden bg-secondary/15 border border-border/15 rounded-xl flex flex-col h-full transition-all duration-300 hover:border-border/30 hover:bg-secondary/20">
          {/* Image Section */}
          <div className="relative h-40 overflow-hidden bg-muted/20">
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Price Badge */}
            <div className="absolute top-2.5 right-2.5">
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-medium backdrop-blur-sm ${
                  isFree
                    ? "bg-foreground/10 text-foreground/80"
                    : "bg-accent/20 text-accent/90"
                }`}
              >
                {isFree ? "Free" : `$${asset.price}`}
              </span>
            </div>

            {/* Type Badge */}
            <div className="absolute top-2.5 left-2.5">
              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-background/50 backdrop-blur-sm text-foreground/70 capitalize">
                {asset.type}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-3.5 flex flex-col flex-1">
            {/* Name */}
            <div className="flex-1 mb-2.5">
              <h3 className="font-medium text-sm line-clamp-2 text-foreground/95">
                {asset.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 capitalize">
                {asset.category}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/10 pt-2.5 mb-2.5">
              <div className="flex items-center gap-1">
                <Star size={12} className="fill-accent/60 text-accent/60" />
                <span className="font-medium text-foreground/85 text-xs">
                  {asset.rating.toFixed(1)}
                </span>
                <span className="text-muted-foreground/70 text-xs">
                  ({asset.reviews})
                </span>
              </div>
              <div className="flex items-center gap-0.5 text-muted-foreground/70">
                <Download size={12} />
                <span className="text-xs">{asset.downloads}</span>
              </div>
            </div>

            {/* Author */}
            <div className="flex items-center gap-1.5 border-t border-border/10 pt-2.5 mb-3">
              <p className="text-xs text-muted-foreground/70 truncate">
                {asset.authorName}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={isFree ? handleDownload : (e) => e.preventDefault()}
              disabled={downloading && isFree}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all duration-200 text-xs disabled:opacity-50 ${
                isFree
                  ? "bg-secondary/30 border border-border/20 text-foreground/80 hover:bg-secondary/45 hover:border-border/30 disabled:hover:bg-secondary/30"
                  : "bg-accent/10 text-accent/90 border border-accent/15 hover:bg-accent/15 hover:border-accent/25"
              }`}
            >
              {isFree ? (
                <>
                  <Download size={13} />
                  {downloading ? "Downloading..." : "Download"}
                </>
              ) : (
                <>
                  <Lock size={13} />
                  Get Access
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
