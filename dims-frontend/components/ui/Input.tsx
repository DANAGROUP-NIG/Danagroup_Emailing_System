// TODO: Implement Input Component
// Props: label?: string, error?: string, leftIcon?: ReactNode, rightIcon?: ReactNode,
//        ...InputHTMLAttributes
// - Wraps <input> with .dims-input CSS class
// - Renders optional label above, error message below in dana-red
// - Supports left/right icon slots
import getAutoCompleteValue from "@/utils/getAutoCompleteValue";
import { forwardRef, InputHTMLAttributes } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface ComposeInputProp extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  errors?: FieldError;
}

interface InputProp {
  label?: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  type: string;
  name?: string;
  autoComplete?: string;
  className?: string;
  disabled?: boolean;
  errors?: any
}

export default function Input({label, placeholder, register, type, name, disabled}: InputProp) {
  const autocompleteValue = getAutoCompleteValue(name, type);

  // TODO: Implement
  return (
    <div >
      <p className="text-xs mb-1 text-gray-500">{label}</p>
      <input 
        {...register} 
        type={type} 
        id={name}
        name={name} 
        autoComplete={autocompleteValue}
        disabled={disabled} 
        className={`border-gray-300 rounded pl-3 focus:outline-none focus:ring-2 focus:ring-dana-blue-300 focus:border-transparent border-[1px] py-2 shadow-sm w-full target:text-gray-400 placeholder:text-xs`}  placeholder={placeholder}/>
    </div>
  )
}



export const ComposeInput = forwardRef<HTMLInputElement, ComposeInputProp>(function ComposeInput({ label, placeholder, errors, ...props }, ref) {
  // const autocompleteValue = getAutoCompleteValue(name, type);

  // TODO: Implement
  return (
    <div >
      <p className="text-xs mb-1 text-gray-500">{label}</p>
      <input
        {...props} 
        ref={ref}
        placeholder={placeholder}
        className={`w-full shadow-sm border-[1px] py-3 text-sm pl-3 rounded-[5px] border-gray-100 outline-none ${errors ? 'border-red-500' : 'border-gray-100'}`}
      />
      {errors && <span className="text-xs text-red-500 px-1">{errors.message}</span>}

    </div>
  )
})