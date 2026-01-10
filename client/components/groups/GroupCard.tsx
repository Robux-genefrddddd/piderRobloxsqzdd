import { Link } from "react-router-dom";
import { Users, MessageSquare } from "lucide-react";
import { Group } from "@shared/api";
import { cn } from "@/lib/utils";

interface GroupCardProps {
  group: Group;
  onClick?: () => void;
  className?: string;
}

export default function GroupCard({
  group,
  onClick,
  className,
}: GroupCardProps) {
  return (
    <div
      className={cn(
        "p-3 bg-card border border-border/30 rounded-lg cursor-pointer hover:border-border/60 hover:bg-card/80 transition-all flex flex-col justify-between h-full",
        className,
      )}
      onClick={onClick}
    >
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate mb-1">
          {group.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {group.description}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-2 border-t border-border/20">
        <Users size={12} />
        <span>
          {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
        </span>
      </div>
    </div>
  );
}
