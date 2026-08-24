import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-editor-bg disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary: 'bg-editor-accent text-white shadow-[0_8px_24px_rgba(109,140,255,0.18)] hover:bg-indigo-400 focus:ring-indigo-400',
      secondary: 'bg-white/[0.025] text-gray-200 border border-white/10 hover:bg-white/[0.06] focus:ring-editor-border',
      ghost: 'text-gray-300 hover:bg-editor-hover hover:text-white focus:ring-editor-border',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizeStyles = {
      sm: 'px-2.5 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
