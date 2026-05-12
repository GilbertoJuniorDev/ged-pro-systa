interface SkeletonProps {
  readonly className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-md bg-slate-200 animate-pulse dark:bg-slate-800 ${className}`}
      aria-hidden="true"
    />
  );
}
