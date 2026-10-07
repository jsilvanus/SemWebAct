export function isAllowedOrigin(urlValue: string, allowedDomains: string[]): boolean {
  const host = new URL(urlValue).hostname.toLowerCase();
  return allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}
