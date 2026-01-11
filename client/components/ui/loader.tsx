interface LoaderProps {
  text?: string;
  minDisplay?: number;
}

export function Loader({ text, minDisplay = 1500 }: LoaderProps) {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center space-y-6">
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

        <div className="flex justify-center items-center gap-2">
          <span className="text-6xl text-foreground font-light leading-none animate-dot-1">
            .
          </span>
          <span className="text-6xl text-foreground font-light leading-none animate-dot-2">
            .
          </span>
          <span className="text-6xl text-foreground font-light leading-none animate-dot-3">
            .
          </span>
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

        @keyframes dot-blink-1 {
          0%, 20%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes dot-blink-2 {
          0%, 35%, 100% {
            opacity: 0.3;
          }
          65% {
            opacity: 1;
          }
        }

        @keyframes dot-blink-3 {
          0%, 50%, 100% {
            opacity: 0.3;
          }
          80% {
            opacity: 1;
          }
        }

        .animate-dot-1 {
          animation: dot-blink-1 1.4s infinite;
        }

        .animate-dot-2 {
          animation: dot-blink-2 1.4s infinite;
        }

        .animate-dot-3 {
          animation: dot-blink-3 1.4s infinite;
        }
      `}</style>
    </div>
  );
}
