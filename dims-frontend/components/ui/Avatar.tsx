"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

// TODO: Implement Avatar Component
// Props: src?: string, name: string, size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
// - Built on @radix-ui/react-avatar (Avatar, AvatarImage, AvatarFallback)
// - Fallback shows initials from name (first + last initial) on dana-blue bg
// - size variants: xs=6, sm=8, md=10, lg=12, xl=16 (Tailwind units)

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string;
  name: string;
  size?: keyof typeof sizeClasses;
}

export default function Avatar({ src, name, size = "md", className, ...props }: AvatarProps) {
  // Helper to get initials (e.g., "Amina Yusuf" -> "AY")
  const initials = React.useMemo(() => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [name]);

  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border border-border shadow-sm",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <AvatarPrimitive.Image
        src={src}
        alt={name}
        className="aspect-square h-full w-full object-cover"
      />
      <AvatarPrimitive.Fallback
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full font-semibold text-white",
          "bg-dana-blue" // Fallback shows initials on dana-blue bg
        )}
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
