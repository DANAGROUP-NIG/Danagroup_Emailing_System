"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";

const SIGNATURE_QUERY_KEY = ["users", "me", "signature"] as const;

export function useSignature() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: SIGNATURE_QUERY_KEY,
    queryFn: async () => {
      const res = await usersApi.getSignature();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { mutateAsync: saveSignature, isPending: isSaving } = useMutation({
    mutationFn: (signature: string | null) =>
      usersApi.updateSignature(signature).then((r) => r.data),
    onSuccess: (result) => {
      queryClient.setQueryData(SIGNATURE_QUERY_KEY, result);
    },
  });

  return {
    signature: data?.signature ?? null,
    isLoading,
    saveSignature,
    isSaving,
  };
}
