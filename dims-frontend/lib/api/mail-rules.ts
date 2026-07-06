import apiClient from "./client";
import type { MailRule, CreateMailRuleInput, UpdateMailRuleInput } from "@/types/mail-rules.types";

export const mailRulesApi = {
  list: () =>
    apiClient.get<MailRule[]>("/mail-rules"),

  create: (payload: CreateMailRuleInput) =>
    apiClient.post<MailRule>("/mail-rules", payload),

  update: (id: string, payload: UpdateMailRuleInput) =>
    apiClient.patch<MailRule>(`/mail-rules/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete(`/mail-rules/${id}`),
};
