import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ASSET_CATEGORIES = [
  "3D Models",
  "UI Design",
  "Scripts",
  "Animations",
  "Plugins",
  "Sounds",
  "Images",
  "Other",
];

interface UploadStep2Props {
  name: string;
  description: string;
  category: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export function UploadStep2({
  name,
  description,
  category,
  onNameChange,
  onDescriptionChange,
  onCategoryChange,
}: UploadStep2Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-0.5">
          Asset details
        </h2>
        <p className="text-xs text-muted-foreground/70">
          Tell us about your asset
        </p>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-foreground">
          Asset Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Modern UI Components"
          className="w-full px-2.5 py-1.5 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 text-xs"
          required
        />
        <p className="text-xs text-muted-foreground/60">
          Clear and descriptive name (max 100 characters)
        </p>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-foreground">
          Description <span className="text-destructive">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe your asset in detail..."
          rows={3}
          className="w-full px-2.5 py-1.5 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 text-xs resize-none"
          required
        />
        <p className="text-xs text-muted-foreground/60">
          {description.length}/500 characters
        </p>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-foreground">
          Category <span className="text-destructive">*</span>
        </label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="bg-background/50 border-border/30 text-xs h-8">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {ASSET_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground/60">
          Choose the category that best describes your asset
        </p>
      </div>
    </div>
  );
}
