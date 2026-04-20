// TODO: Implement Login Page
// - Dana Group branded login form
// - Email + password fields
// - JWT token stored in httpOnly cookie via API
// - Redirect to /mail/inbox on success
// - Show error message on failed login
"use client"

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Image from "next/image";
import Link from "next/link";
import * as z from "zod";
import Logo from "../login/logo.png"
import { set, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/Toast";
import { Eye, EyeOff } from 'lucide-react';
import { useState } from "react";

import bg from "@/assets/Modern office with sleek lighting.jpg"
import logoBg from "@/assets/Elegantly designed envelope with gradient swoosh.jpg"



// export default function LoginPage() {
//   return null;
// }



const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string()
  .min(8, "Password must be at least 8 characters")
  .max(100)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number"),
  // .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  rememberMe: z.boolean().optional(),
})

type LoginSchema = z.infer<typeof loginSchema>;


export default function LoginPage() {

  const [showPassword, setShowPassword] = useState(false);

  const {login} = useAuthStore();;

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    defaultValues:{
      // Look for saved email, otherwise empty string
      email: typeof window !== 'undefined' ? localStorage.getItem('rememberedEmail') || '' : '',
      rememberMe: typeof window !== 'undefined' ? !!localStorage.getItem('rememberedEmail') : false,
    },
    resolver: zodResolver(loginSchema), // 3. Connect Zod to Hook Form
    shouldUnregister: false, 
  });

  const onSubmit = async (data: LoginSchema) => {
    // console.log("Form Data:", data);
    // Call Zustand 'login' function
    try {
      const success = await login(data);

      if (success) {

        if(data.rememberMe) {
          localStorage.setItem("rememberedEmail", data.email);
        }else{
          localStorage.removeItem("rememberedEmail");
        }
         setTimeout(() => router.push("/mail/inbox"), 500);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
    
  };



  return (
    <section className="min-h-screen flex w-full">
      <Toast />
      {/* Image */}
      <div className="h-screen w-full relative">
        <Image  alt="background" src={bg} className="absolute object-cover h-full"/>
        {/* Logo */}
        <div className=" z-20 absolute top-2 left-2">
          <div className="relative max-h-16">

            <Image src={logoBg} alt="logo-bg" className="w-24 object-cover"/>

            <div className="absolute top-[4vh] left-[0.5vw] ]">
              <div> <Image src={Logo} alt="Logo" className="object-contain  w-20"/> </div>
            </div>
          </div>
          
        </div>
      </div>

      

      <div className="shadow-xl h-screen w-full flex justify-center items-center relative ">
        
        {/* form */}
        <div className="shadow-md h-[85%] w-[70%] z-20 bg-white flex flex-col px-16 justify-center rounded">
          <form 
          autoComplete="on"
          method="POST"
          onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-2">
                <h3 className="font-medium tracking-wider">Welcome Back to Dana DIMS</h3>
                <p className="text-xs text-gray-600">Sign in your account</p>
              </div>

              <div className=" flex flex-col gap-4 ">
                <Input 
                 register={register("email")}  
                 name="email"
                 label="Email address" 
                 placeholder="Enter your email" 
                 type="email"
                 aria-hidden="true"
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

               
                <div className="relative">

                  <Input 
                    label="Password"
                    placeholder="Enter your password"
                    type="password"
                    aria-hidden="true"
                    // We use the same register so the value stays synced
                    register={register("password")} 
                    name="password"
                  />
                  

                  <button type="button" className="absolute top-0 pt-6 right-2 flex items-center h-[62px] z-10"
                  onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={14} color="gray"/> : <Eye size={14} color="gray"/>}
                  </button>
                  {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>

              </div>
              
              <div className="flex justify-between text-xs">

                <div>
                  <label className="flex items-center gap-[3px] text-gray-600 cursor-pointer">
                    <input {...register("rememberMe")} className="border-gray-300 accent-dana-blue-600 w-[10px] h-[10px] cursor-pointer" type="checkbox" />
                    Remember Me
                  </label>
                </div>

                <Link className="hover:text-dana-blue-700 text-dana-blue-500" href="/forgotpassword">Forgot Password?</Link>
              </div>

              <div>
                <Button 
                  type="submit" 
                  label="Login"  
                  disabled={isSubmitting} 
                  btnStyle="py-2 bg-black/95 w-full text-white rounded" 
                  onMouseDown={() => setShowPassword(false)} 
                />
              </div>
            </div>
          </form>
        </div>

        {/* boxes */}

        <div className="absolute top-[4vh] left-[2vw] h-24 w-24 rounded-lg bg-gradient-to-br from-red-600 via-blue-800 to-blue-400 p-[7px]">
          <div className="h-full w-full rounded-sm bg-white"></div>
        </div>


        <div className="absolute top-[20vw] right-[0vw] ">

          <div className="">
            <div className="absolute z-10 right-[5vw] -bottom-[5vh] h-16 w-16 rounded-lg bg-gradient-to-br from-red-600 via-blue-800 to-blue-400 p-[4px]">
              <div className="h-full w-full rounded-sm bg-white"></div>
            </div>

            <div className="absolute top-0 right-0 h-24 w-24 rounded-lg bg-gradient-to-br from-red-600 via-blue-800 to-blue-400 p-[4px]">
              <div className="h-full w-full rounded-sm"></div>
            </div>
          </div>

        </div>


        <div className="absolute bottom-[4vh] left-[4vw] h-24 w-24 rounded-lg bg-gradient-to-br from-red-600 via-blue-800 to-blue-400 p-[10px]">
          <div className="h-full w-full rounded-sm bg-white"></div>
        </div>


      </div>
    </section>
  );
}