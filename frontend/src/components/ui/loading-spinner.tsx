import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <div className={cn(
      "relative",
      size === "sm" && "w-4 h-4",
      size === "md" && "w-6 h-6",
      size === "lg" && "w-8 h-8",
      className
    )}>
      <div className="absolute w-full h-full rounded-full border-2 border-primary/20" />
      <div className="absolute w-full h-full rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}