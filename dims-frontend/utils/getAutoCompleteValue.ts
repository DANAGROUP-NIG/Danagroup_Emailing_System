

const getAutoCompleteValue = (name?: string, type?: string) => {
  if (!name) return "off";

  const lower = name.toLowerCase();

  if (lower.includes("email")) return "email";
  if (lower.includes("user")) return "username";
  if (lower.includes("pass")) {
    return type === "password" ? "current-password" : "off";
  }
  if (lower.includes("first")) return "given-name";
  if (lower.includes("last")) return "family-name";
  if (lower.includes("phone")) return "tel";
  if (lower.includes("address")) return "street-address";
  if (lower.includes("city")) return "address-level2";
  if (lower.includes("zip") || lower.includes("postal")) return "postal-code";

  return "off"; // default
}

export default getAutoCompleteValue
