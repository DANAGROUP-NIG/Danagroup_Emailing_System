// TODO: Implement Input Component
// Props: label?: string, error?: string, leftIcon?: ReactNode, rightIcon?: ReactNode,
//        ...InputHTMLAttributes
// - Wraps <input> with .dims-input CSS class
// - Renders optional label above, error message below in dana-red
// - Supports left/right icon slots
import { UseFormRegisterReturn } from "react-hook-form";

interface InputProp {
  title: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  type: string;
  name?: string;
  autoComplete?: string
}

export default function Input({title, placeholder, register, type, autoComplete, name}: InputProp) {
  // TODO: Implement
  return (
    <div >
      <p className="text-xs mb-1 text-gray-500">{title}</p>
      <input 
        {...register} 
        type={type} 
        name={name} 
        autoComplete={autoComplete} 
        className="border-gray-300 rounded pl-3 focus:outline-none focus:ring-2 focus:ring-dana-blue-300 focus:border-transparent border-[1px] py-2 shadow-sm w-full target:text-gray-400 placeholder:text-xs"  placeholder={placeholder}/>
    </div>
  )
}
