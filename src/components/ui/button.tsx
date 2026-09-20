import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-8 whitespace-nowrap rounded-md text-body font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-16 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-parchment",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "border border-border bg-transparent text-ink hover:bg-warm-mist/35",
        outline: "border border-border bg-soft-paper text-ink hover:bg-warm-mist/35",
        link: "text-primary underline-offset-4 hover:underline",
        plain: "bg-transparent text-ink hover:bg-warm-mist/35",
      },
      size: {
        default: "h-36 px-16 py-0",
        dense: "h-32 px-12 py-0 text-body-sm",
        icon: "size-32",
        iconSm: "size-24",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
