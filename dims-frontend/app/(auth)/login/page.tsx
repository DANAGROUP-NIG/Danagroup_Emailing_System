"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast";
import { useBranding } from "@/hooks/useBranding";

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "Password is required")
    .max(100, "Password is too long"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"credentials" | "totp">("credentials");
  const [totpCode, setTotpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { login, verifyTotp, pending2FAEmail } = useAuthStore();
  const branding = useBranding();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "", rememberMe: false },
    resolver: zodResolver(loginSchema),
  });

  // Read remembered email only after mount — avoids SSR/hydration mismatch
  useEffect(() => {
    const remembered = localStorage.getItem("rememberedEmail");
    if (remembered) {
      reset({ email: remembered, rememberMe: true, password: "" });
    }
  }, [reset]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const result = await login({ email: data.email, password: data.password });

      if (result.requires2FA) {
        if (data.rememberMe) {
          localStorage.setItem("rememberedEmail", data.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        setMode("totp");
        return;
      }

      if (result.success) {
        if (data.rememberMe) {
          localStorage.setItem("rememberedEmail", data.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        const redirectTo = searchParams.get("redirect") ?? "/mail/inbox";
        router.replace(redirectTo);
      } else {
        showToast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "error",
        });
      }
    } catch {
      showToast({
        title: "Something went wrong",
        description: "Unable to reach the server. Try again later.",
        variant: "error",
      });
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const success = await verifyTotp(totpCode);
      if (success) {
        const redirectTo = searchParams.get("redirect") ?? "/mail/inbox";
        router.replace(redirectTo);
      } else {
        showToast({
          title: "Invalid code",
          description: "The 6-digit code is incorrect or expired. Please try again.",
          variant: "error",
        });
      }
    } catch {
      showToast({
        title: "Something went wrong",
        description: "Unable to verify the code. Try again later.",
        variant: "error",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="dims-card space-y-8">
      {/* Header */}
      <div className="mb-6 flex justify-center">
        <img
          src={branding.logoUrl}
          alt={`${branding.name} logo`}
          className="h-8 w-auto object-contain"
        />
      </div>


      {mode === "totp" ? (
        <form
          aria-label="Verify two-factor authentication"
          noValidate
          onSubmit={handleVerifyTotp}
          className="space-y-5"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the 6-digit code from your authenticator app for{" "}
                <span className="font-medium text-foreground">{pending2FAEmail}</span>
              </p>
            </div>
          </div>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            autoFocus
            className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isVerifying}
            disabled={totpCode.length < 6}
          >
            Verify
          </Button>

          <button
            type="button"
            onClick={() => { setMode("credentials"); setTotpCode(""); }}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to sign in
          </button>
        </form>
      ) : (
        <form
          aria-label="Sign in to DIMS"
          autoComplete="on"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {/* Email */}
          <Input
            {...register("email")}
            id="email"
            label=""
            type="email"
            autoComplete="email"
            placeholder="Email address"
            error={errors.email?.message}
            fullWidth
          />

          {/* Password */}
          <div className="relative">
            <Input
              {...register("password")}
              id="password"
              label=""
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
              error={errors.password?.message}
              fullWidth
              rightIcon={
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="pointer-events-auto text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground">
              <input
                {...register("rememberMe")}
                type="checkbox"
                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
              Remember me
            </label>

            {/* <Link
              href="/forgot-password"
              className="text-primary hover:text-primary-hover transition-colors font-medium"
            >
              Forgot password?
            </Link> */}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
          >
            Sign in
          </Button>

          <div className="flex flex-row items-center justify-center gap-1">
            <Lock className="h-4 w-4 text-slate-500" />
            <p className="text-xs text-muted-foreground">
              Dana Group Internal Email System
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
