import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

interface StepPasswordProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  error?: string;
}

export function StepPassword({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  error,
}: StepPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = password && confirmPassword === password;
  const passwordLong = password.length >= 8;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Create a password
        </h2>
        <p className="text-sm text-muted-foreground">
          Make it strong and secure
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3 bg-destructive/15 border border-destructive/30 rounded-lg">
          <AlertCircle size={16} className="text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Password */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          Password <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-3 text-muted-foreground"
            size={16}
          />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors text-sm"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          At least 8 characters recommended
        </p>
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-foreground"
        >
          Confirm Password <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-3 text-muted-foreground"
            size={16}
          />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors text-sm"
            required
          />
        </div>
      </div>

      {/* Password Strength Indicator */}
      {password && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {passwordLong ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">
              At least 8 characters
            </span>
          </div>
          <div className="flex items-center gap-2">
            {passwordsMatch ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">
              Passwords match
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
