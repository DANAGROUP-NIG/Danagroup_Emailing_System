"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MailCheck, ArrowLeft } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { authApi } from "@/lib/api";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .toLowerCase()
    .trim(),
});

type FormValues = z.infer<typeof schema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: "" },
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await authApi.requestPasswordReset(data.email);
    } catch {
      // Intentionally swallow errors — we never reveal whether the email exists.
    } finally {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="dims-card space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-success">
            <MailCheck size={28} aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Check your inbox</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If your email is registered with DIMS, you&apos;ll receive a
            password-reset link within 5 minutes. Check your spam folder if it
            doesn&apos;t arrive.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="dims-card space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the email linked to your account and we&apos;ll send you a reset
          link.
        </p>
      </div>

      {/* Form */}
      <form
        aria-label="Request password reset"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <Input
          {...register("email")}
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@danagroup.internal"
          error={errors.email?.message}
          fullWidth
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
        >
          Send reset link
        </Button>
      </form>

      {/* Back link */}
      <Link
        href="/login"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to sign in
      </Link>
    </div>
  );
}
