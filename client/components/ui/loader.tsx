import { useEffect, useState } from "react";

interface LoaderProps {
  text?: string;
  minDisplay?: number;
}

export function Loader({ text, minDisplay = 1500 }: LoaderProps) {
  const [showLoader, setShowLoader] = useState(true);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(true);
    }, minDisplay);

    return () => clearTimeout(timer);
  }, [minDisplay]);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === ".") return "..";
        if (prev === "..") return "...";
        return ".";
      });
    }, 500);

    return () => clearInterval(dotInterval);
  }, []);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Roblox_Logo.svg/2048px-Roblox_Logo.svg.png"
            alt="Loading"
            className="w-16 h-16 animate-spin"
            style={{
              animation: "spin 2s linear infinite",
            }}
          />
        </div>
        <div className="h-6 flex items-center justify-center">
          <p className="text-muted-foreground text-sm font-medium w-6">
            {dots}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
