import { User } from "lucide-react";

interface StepUserInfoProps {
  username: string;
  displayName: string;
  onUsernameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  error?: string;
}

export function StepUserInfo({
  username,
  displayName,
  onUsernameChange,
  onDisplayNameChange,
  error,
}: StepUserInfoProps) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Create your profile
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose your username and display name
        </p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-lg">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Username */}
      <div className="space-y-2">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-foreground"
        >
          Username <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <User
            className="absolute left-3 top-3 text-muted-foreground"
            size={16}
          />
          <input
            id="username"
            type="text"
            placeholder="yourname"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors text-sm"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          At least 3 characters, can contain letters and numbers
        </p>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-foreground"
        >
          Display Name <span className="text-muted-foreground">(Optional)</span>
        </label>
        <input
          id="displayName"
          type="text"
          placeholder="Your Full Name"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors text-sm"
        />
        <p className="text-xs text-muted-foreground">
          This is what other users will see
        </p>
      </div>
    </div>
  );
}
