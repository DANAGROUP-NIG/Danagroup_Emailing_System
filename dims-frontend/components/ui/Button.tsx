// TODO: Implement Button Component
// Props: variant: 'primary' | 'danger' | 'outline' | 'ghost', size: 'sm' | 'md' | 'lg',
//        isLoading?: boolean, leftIcon?: ReactNode, rightIcon?: ReactNode, ...ButtonHTMLAttributes
// - Uses class-variance-authority (cva) for variant + size classes
// - Shows Spinner when isLoading is true, disables button
// - Primary: dana-blue background, white text
// - Danger: dana-red background, white text
// - Outline: transparent bg, dana-blue border + text
// - Ghost: transparent bg, no border
interface btnProp {
  label: string;
  btnStyle: string;
  type?: "submit" | "button" | "reset"; 
  onClick?: () => void;
  disabled?: boolean;
}
export default function Button({label, btnStyle, type, onClick, disabled}: btnProp) {
  // TODO: Implement
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={btnStyle}>
      {disabled ? "Loading..." : label }
    </button>
  )
}
