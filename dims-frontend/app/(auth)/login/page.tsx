"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";

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
  const { login } = useAuthStore();
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
      const success = await login({ email: data.email, password: data.password });

      if (success) {
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

  return (
    <div className="dims-card space-y-8">
      {/* Header */}
      <Image src={logo} alt="Dana Group logo" width={144} height={28} className="object-contain mb-6 flex justify-self-center" />


      {/* Form */}
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

          <Link
            href="/forgot-password"
            className="text-primary hover:text-primary-hover transition-colors font-medium"
          >
            Forgot password?
          </Link>
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
            Dana Group Internal Messaging System (DIMS)
          </p>
        </div>
      </form>
    </div>
  );
}
