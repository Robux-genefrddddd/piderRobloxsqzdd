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
        "card-hover p-4 cursor-pointer h-full flex flex-col justify-between",
        className,
      )}
      onClick={onClick}
    >
      <div>
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-foreground truncate flex-1">
            {group.name}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {group.description}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users size={14} />
          <span>{group.memberCount} members</span>
        </div>
      </div>
    </div>
  );
}
