export function getEmailDomain(emailAddress: string | undefined | null): string {
  if (!emailAddress) return "";
  
  const [, domain] = emailAddress.split("@");
  return domain ? domain.toLowerCase() : "";
}

