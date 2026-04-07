import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn("mb-4 flex items-center justify-between", className)}>{children}</div>;
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <h3 className={cn("text-base font-semibold text-gray-800 dark:text-gray-100", className)}>
      {children}
    </h3>
  );
}
