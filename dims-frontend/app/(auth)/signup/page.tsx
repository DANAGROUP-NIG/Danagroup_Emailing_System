"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import type { User } from '@/types/user.types';

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { authApi } from "@/lib/api/auth";
import { useCreateUser } from "@/hooks/useAdmin";
import Modal from "@/components/ui/Modal";

const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(100, "First name is too long")
      .trim(),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(100, "Last name is too long")
      .trim(),
    emailLocalPart: z
      .string()
      .min(1, "Email name is required")
      .max(64, "Email name is too long")
      .toLowerCase()
      .trim()
      .regex(
        /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/,
        "Enter only the part before @",
      ),
    emailDomain: z.string().min(1, "Choose an email domain"),
    departmentId: z
      .string()
      .min(1, "Choose your department")
      .trim(),
    jobTitle: z
      .string()
      .max(150, "Job title is too long")
      .trim()
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long")
      .regex(/[a-z]/, "Password needs a lowercase letter")
      .regex(/[A-Z]/, "Password needs an uppercase letter")
      .regex(/\d/, "Password needs a number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage(
  {
    isOpen,
    onClose,
    initialUser,
  }: {
    isOpen: boolean;
    onClose: () => void;
    initialUser?: User | undefined;
  }
) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const createUser = useCreateUser();
  const { showToast } = useToast();
  const { data: signupOptions, isLoading: isLoadingOptions } = useQuery({
    queryKey: ["auth", "signup-options"],
    queryFn: async () => {
      const response = await authApi.signupOptions();
      return response.data.data ?? { subsidiaries: [] };
    },
    staleTime: 60 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      emailLocalPart: "",
      emailDomain: "",
      departmentId: "",
      jobTitle: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(signupSchema),
  });
  const emailDomain = watch("emailDomain");
  const departmentId = watch("departmentId");
  const subsidiaries = signupOptions?.subsidiaries ?? [];
  const selectedSubsidiary = subsidiaries.find(
    (subsidiary) => subsidiary.domain === emailDomain,
  );
  const departments = selectedSubsidiary?.departments ?? [];

  const onSubmit = async (data: SignupFormValues) => {
    const email = `${data.emailLocalPart}@${data.emailDomain}`.toLowerCase();
    const selectedDepartment = departments.find(
      (department) => department.id === data.departmentId,
    );

    if (!selectedSubsidiary || !selectedDepartment) {
      showToast({
        title: "Unable to create user",
        description: "Select a valid subsidiary and department.",
        variant: "error",
      });
      return;
    }

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email,
      password: data.password,
      department: selectedDepartment.name,
      subsidiary: selectedSubsidiary.name,
      role: "employee",
      ...(data.jobTitle ? { jobTitle: data.jobTitle } : {}),
    };

    try {
      await createUser.mutateAsync(payload);
      onClose();
    } catch {
      // useCreateUser owns the error toast and leaves the modal open for retry.
    }
  };

  return (
    <div className="space-y-8 ">
      {/* <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Use your company email so DIMS can match your subsidiary.
        </p>
      </div> */}

      <Modal
        open={isOpen}
        onClose={onClose}
        title={initialUser ? 'Edit User' : 'Create User'}
        size="lg"
      >
        <div className="rounded-lg">
          <form
            aria-label="Create a DIMS account"
            autoComplete="on"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                {...register("firstName")}
                id="firstName"
                label="First name"
                autoComplete="given-name"
                placeholder="John"
                error={errors.firstName?.message}
                fullWidth
              />

              <Input
                {...register("lastName")}
                id="lastName"
                label="Last name"
                autoComplete="family-name"
                placeholder="Doe"
                error={errors.lastName?.message}
                fullWidth
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Company email
              </label>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.9fr)]">
                <Input
                  {...register("emailLocalPart")}
                  id="signup-email-local"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  placeholder="john.doe"
                  error={errors.emailLocalPart?.message}
                  fullWidth
                />

                <Select
                  value={emailDomain}
                  disabled={isLoadingOptions || subsidiaries.length === 0}
                  onValueChange={(value) => {
                    setValue("emailDomain", value, { shouldValidate: true });
                    setValue("departmentId", "", { shouldValidate: true });
                  }}
                >
                  <SelectTrigger
                    id="signup-email-domain"
                    aria-label="Select email domain"
                  >
                    <SelectValue
                      placeholder={
                        isLoadingOptions ? "Loading domains..." : "Select domain"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {subsidiaries.map((subsidiary) => (
                      <SelectItem key={subsidiary.id} value={subsidiary.domain}>
                        @{subsidiary.domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.emailDomain?.message ? (
                <p className="text-sm text-destructive">
                  {errors.emailDomain.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Subsidiary
              </label>
              <div className="flex h-10 items-center rounded-lg border border-input bg-muted/40 px-3 text-sm text-foreground">
                {selectedSubsidiary?.name ?? "Select an email domain first"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Department
              </label>
              <Select
                value={departmentId}
                disabled={!selectedSubsidiary || departments.length === 0}
                onValueChange={(value) =>
                  setValue("departmentId", value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="departmentId" aria-label="Select department">
                  <SelectValue
                    placeholder={
                      selectedSubsidiary
                        ? "Select department"
                        : "Select a domain first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId?.message ? (
                <p className="text-sm text-destructive">
                  {errors.departmentId.message}
                </p>
              ) : null}
            </div>

            <Input
              {...register("jobTitle")}
              id="jobTitle"
              label="Job title"
              autoComplete="organization-title"
              placeholder="Software Engineer"
              error={errors.jobTitle?.message}
              fullWidth
            />

            <Input
              {...register("password")}
              id="signup-password"
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
              error={errors.password?.message}
              fullWidth
              rightIcon={
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="pointer-events-auto text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                  onClick={() => setShowPassword((value) => !value)}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Input
              {...register("confirmPassword")}
              id="confirmPassword"
              label="Confirm password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              fullWidth
              rightIcon={
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  className="pointer-events-auto text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  tabIndex={0}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
            >
              Create account
            </Button>
          </form>
        </div>
      </Modal>

    </div>
  );
}
