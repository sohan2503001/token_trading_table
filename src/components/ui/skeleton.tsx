'use client';

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "pulse" | "shimmer";
}

/**
 * High-performance Skeleton component
 * - Supports shimmer & pulse
 * - Zero layout shift
 * - Memoized for Lighthouse performance
 * - Fully typed + accessible
 */
export const Skeleton = React.memo(
  React.forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, variant = "shimmer", ...props }, ref) => {
      const baseClasses = "rounded-md bg-gray-800/50";

      const variantClasses = {
        pulse: "animate-pulse",
        shimmer:
          "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
      } as const;

      return (
        <div
          ref={ref}
          role="presentation"
          aria-hidden="true"
          data-slot="skeleton"
          className={cn(baseClasses, variantClasses[variant], className)}
          {...props}
        />
      );
    }
  )
);

Skeleton.displayName = "Skeleton";