// TODO: Implement Login Page
// - Dana Group branded login form
// - Email + password fields
// - JWT token stored in httpOnly cookie via API
// - Redirect to /mail/inbox on success
// - Show error message on failed login
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast"; // ✅ Radix toast hook
import { Eye, EyeOff } from "lucide-react";

import bg from "@/assets/Modern office with sleek lighting.jpg";
import logoBg from "@/assets/Elegantly designed envelope with gradient swoosh.jpg";
import Logo from "../login/logo.png";

// ------------------- Form Validation -------------------
const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  rememberMe: z.boolean().optional(),
});

type LoginSchema = z.infer<typeof loginSchema>;

// ------------------- Login Page -------------------
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();
  const { showToast } = useToast(); // ✅ Radix toast

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    defaultValues: {
      email:
        typeof window !== "undefined"
          ? localStorage.getItem("rememberedEmail") || ""
          : "",
      rememberMe:
        typeof window !== "undefined"
          ? !!localStorage.getItem("rememberedEmail")
          : false,
    },
    resolver: zodResolver(loginSchema),
    shouldUnregister: false,
  });

  const onSubmit = async (data: LoginSchema) => {
    try {
      const success = await login(data);

      if (success) {
        if (data.rememberMe) {
          localStorage.setItem("rememberedEmail", data.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        showToast({
          title: "Login Successful",
          description: "Redirecting to inbox...",
          variant: "success",
        });

        setTimeout(() => router.push("/mail/inbox"), 500);
      } else {
        showToast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      showToast({
        title: "Login Failed",
        description: "Something went wrong. Try again later.",
        variant: "error",
      });
    }
  };

  return (
    <section className="min-h-screen flex w-full">
      {/* Background Image */}
      <div className="h-screen w-full relative">
        <Image
          alt="background"
          src={bg}
          className="absolute object-cover h-full w-full"
        />

        {/* Logo */}
        <div className="z-20 absolute top-2 left-2">
          <div className="relative max-h-16">
            <Image src={logoBg} alt="logo-bg" className="w-24 object-cover" />
            <div className="absolute top-[4vh] left-[0.5vw]">
              <Image src={Logo} alt="Logo" className="object-contain w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="shadow-xl h-screen w-full flex justify-center items-center relative">
        <div className="shadow-md h-[85%] w-[70%] z-20 bg-white flex flex-col px-16 justify-center rounded">
          <form autoComplete="on" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-2">
                <h3 className="font-medium tracking-wider">
                  Welcome Back to Dana DIMS
                </h3>
                <p className="text-xs text-gray-600">Sign in your account</p>
              </div>

              <div className="flex flex-col gap-4">
                <Input
                  register={register("email")}
                  name="email"
                  label="Email address"
                  placeholder="Enter your email"
                  type="email"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}

                <div className="relative">
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    register={register("password")}
                    name="password"
                  />
                  <button
                    type="button"
                    className="absolute top-0 pt-6 right-2 flex items-center h-[62px] z-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-xs">
                <label className="flex items-center gap-[3px] text-gray-600 cursor-pointer">
                  <input
                    {...register("rememberMe")}
                    className="border-gray-300 accent-dana-blue-600 w-[10px] h-[10px] cursor-pointer"
                    type="checkbox"
                  />
                  Remember Me
                </label>

                <Link
                  className="hover:text-dana-blue-700 text-dana-blue-500"
                  href="/forgotpassword"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                label="Login"
                disabled={isSubmitting}
                btnStyle="py-2 bg-black/95 w-full text-white rounded"
                onMouseDown={() => setShowPassword(false)}
              />
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}