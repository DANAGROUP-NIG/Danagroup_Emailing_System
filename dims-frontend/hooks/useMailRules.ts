import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mailRulesApi } from "@/lib/api/mail-rules";
import type { CreateMailRuleInput, UpdateMailRuleInput } from "@/types/mail-rules.types";

const RULES_KEY = ["mail-rules"] as const;

export function useMailRules() {
  return useQuery({
    queryKey: RULES_KEY,
    queryFn: () => mailRulesApi.list().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useCreateMailRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMailRuleInput) =>
      mailRulesApi.create(payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RULES_KEY }),
  });
}

export function useUpdateMailRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMailRuleInput }) =>
      mailRulesApi.update(id, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RULES_KEY }),
  });
}

export function useDeleteMailRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mailRulesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RULES_KEY }),
  });
}
