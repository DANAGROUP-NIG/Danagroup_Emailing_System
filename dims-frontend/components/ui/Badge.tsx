// components/ui/Badge.tsx — Extended Badge
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full font-medium w-fit whitespace-nowrap shrink-0 transition-colors [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-muted text-muted-foreground",
        primary:
          "border border-transparent bg-primary text-primary-foreground",
        danger:
          "border border-transparent bg-danger text-danger-foreground",
        success:
          "border border-transparent bg-success text-success-foreground",
        warning:
          "border border-transparent bg-warning text-warning-foreground",
        info:
          "border border-transparent bg-dana-blue-100 text-dana-blue-800",
        outline:
          "border border-border bg-transparent text-foreground",
      },
      size: {
        sm: "px-1.5 py-0 text-[10px]",
        md: "px-2 py-0.5 text-xs",
        lg: "px-2.5 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

function Badge({ className, variant, size, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
