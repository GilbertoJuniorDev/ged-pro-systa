interface SkeletonProps {
  readonly className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-slate-800 rounded-md animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}
