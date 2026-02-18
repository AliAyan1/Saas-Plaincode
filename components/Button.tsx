import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-soft hover:from-primary-600 hover:to-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-950",
  secondary:
    "bg-slate-700 text-slate-100 hover:bg-slate-600 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950",
  outline:
    "border-2 border-primary-500 text-primary-400 bg-transparent hover:bg-primary-500/10 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-950",
  ghost:
    "text-slate-300 hover:bg-slate-800 focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      fullWidth = false,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
