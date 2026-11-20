interface SkeletonProps {
  readonly className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-md bg-border animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}
