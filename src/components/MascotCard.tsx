import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export type MascotPose =
  | "welcome"
  | "budget_warning"
  | "celebration"
  | "zen_resting"
  | "empty_state";

interface MascotCardProps {
  pose: MascotPose;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  customImageSrc?: string;
  className?: string;
}

const MASCOT_IMAGES: Record<MascotPose, string> = {
  welcome: "/mascot/zenfi_mascot_welcome.png",
  budget_warning: "/mascot/zenfi_mascot_warning.png",
  celebration: "/mascot/zenfi_mascot_celebration.png",
  zen_resting: "/mascot/zenfi_mascot_zen.png",
  empty_state: "/mascot/zenfi_mascot_welcome.png",
};

export function MascotCard({
  pose,
  title,
  description,
  actionText,
  onAction,
  customImageSrc,
  className = "",
}: MascotCardProps) {
  const imageSrc = customImageSrc || MASCOT_IMAGES[pose];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/30 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 shadow-xs relative overflow-hidden ${className}`}
    >
      <div className="relative shrink-0">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shadow-inner">
          <img
            src={imageSrc}
            alt={title}
            onError={(e) => {
              // Fallback to emoji avatar if asset image is not loaded yet
              (e.target as HTMLElement).style.display = "none";
              const parent = (e.target as HTMLElement).parentElement;
              if (parent && !parent.querySelector(".fallback-emoji")) {
                const span = document.createElement("span");
                span.className = "fallback-emoji text-4xl animate-bounce";
                span.innerText = "🐨";
                parent.appendChild(span);
              }
            }}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
          <Sparkles className="w-3 h-3" />
        </div>
      </div>

      <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
        <h4 className="text-base font-bold tracking-tight text-foreground flex items-center justify-center sm:justify-start gap-1.5">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>

        {actionText && onAction && (
          <div className="pt-2">
            <button
              onClick={onAction}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all duration-200"
            >
              {actionText}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
