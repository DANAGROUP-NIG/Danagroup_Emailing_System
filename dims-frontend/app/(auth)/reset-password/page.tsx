"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, X, Eye, EyeOff, ArrowLeft, ShieldAlert } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .max(100)
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a symbol"),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

// ─── Password strength rules ──────────────────────────────────────────────────

interface StrengthRule {
  label: string;
  test: (v: string) => boolean;
}

const RULES: StrengthRule[] = [
  { label: "8 or more characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const { showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(!token);

  useEffect(() => {
    if (!token) setTokenInvalid(true);
  }, [token]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { password: "", confirm: "" },
    resolver: zodResolver(schema),
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: FormValues) => {
    if (!token) {
      setTokenInvalid(true);
      return;
    }
    try {
      await authApi.resetPassword({ token, password: data.password });
      showToast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
        variant: "success",
      });
      router.push("/login");
    } catch (err: unknown) {
      const status =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { status?: number } }).response?.status;

      if (status === 400 || status === 401) {
        setTokenInvalid(true);
      } else {
        showToast({
          title: "Something went wrong",
          description: "Unable to reset your password. Please try again.",
          variant: "error",
        });
      }
    }
  };

  // ── Token-invalid state ────────────────────────────────────────────────────
  if (tokenInvalid) {
    return (
      <div className="dims-card space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-light text-danger">
            <ShieldAlert size={28} aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">
            Link expired or invalid
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This password-reset link has either expired or already been used.
            Request a new one and try again.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild variant="primary" size="md" fullWidth>
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="dims-card space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a strong password for your DIMS account.
        </p>
      </div>

      {/* Form */}
      <form
        aria-label="Reset password"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {/* New password */}
        <div className="relative">
          <Input
            {...register("password")}
            id="password"
            label="New password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            fullWidth
            rightIcon={
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="pointer-events-auto text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </div>

        {/* Strength meter */}
        <ul
          aria-label="Password requirements"
          className="grid grid-cols-2 gap-x-4 gap-y-1.5"
        >
          {RULES.map((rule) => {
            const passes = rule.test(passwordValue ?? "");
            return (
              <li
                key={rule.label}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-colors",
                  passes ? "text-success" : "text-muted-foreground",
                )}
              >
                {passes ? (
                  <Check size={12} aria-hidden="true" />
                ) : (
                  <X size={12} aria-hidden="true" />
                )}
                {rule.label}
              </li>
            );
          })}
        </ul>

        {/* Confirm password */}
        <div className="relative">
          <Input
            {...register("confirm")}
            id="confirm"
            label="Confirm new password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat your password"
            error={errors.confirm?.message}
            fullWidth
            rightIcon={
              <button
                type="button"
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="pointer-events-auto text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
        >
          Update password
        </Button>
      </form>

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
