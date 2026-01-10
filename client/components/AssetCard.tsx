import { Link } from "react-router-dom";
import { Asset } from "@/lib/types";
import { Star, Download, Lock } from "lucide-react";

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const isFree = asset.price === null || asset.price === 0;

  return (
    <Link to={`/asset/${asset.id}`}>
      <div className="group h-full card-hover">
        <div className="overflow-hidden rounded-lg bg-card border border-border">
          {/* Image Section */}
          <div className="relative h-48 overflow-hidden bg-muted">
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            
            {/* Badge */}
            <div className="absolute top-3 right-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isFree
                    ? "bg-accent/20 dark:bg-accent/30 text-accent"
                    : "bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary-foreground"
                }`}
              >
                {isFree ? "Free" : `$${asset.price}`}
              </span>
            </div>

            {/* Type Badge */}
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-black/50 dark:bg-white/20 text-white backdrop-blur-sm capitalize">
                {asset.type}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 flex flex-col h-48">
            {/* Name and Category */}
            <div className="flex-1">
              <h3 className="font-semibold text-base line-clamp-2 group-hover:text-accent transition-colors">
                {asset.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {asset.category}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground my-3 border-t border-border pt-3">
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-accent text-accent" />
                <span className="font-medium text-foreground">{asset.rating.toFixed(1)}</span>
                <span>({asset.reviews})</span>
              </div>
              <div className="flex items-center gap-1">
                <Download size={14} />
                <span>{asset.downloads}</span>
              </div>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              {asset.authorAvatar && (
                <img
                  src={asset.authorAvatar}
                  alt={asset.authorName}
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">by {asset.authorName}</p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                if (isFree) {
                  // Handle free download
                } else {
                  // Handle purchase redirect
                }
              }}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary hover:bg-muted text-foreground font-medium transition-colors text-sm"
            >
              {isFree ? (
                <>
                  <Download size={16} />
                  Download
                </>
              ) : (
                <>
                  <Lock size={16} />
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
