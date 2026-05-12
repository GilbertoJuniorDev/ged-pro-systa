export interface HttpRequest {
  readonly ip?: string;
  readonly headers: Record<string, string | undefined>;
  readonly user?: unknown;
}
