import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, type = 'text', className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="mb-4">
        <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5 tracking-[0.01em]">
          {label}
        </label>
        <div className="relative group">
          {/* Icono izquierdo */}
          {icon && (
            <div className={cn(
              "absolute left-[13px] top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-200",
              error ? "text-red-400" : "group-focus-within:text-brand-400"
            )}>
              {React.cloneElement(icon as React.ReactElement<{ size?: number; strokeWidth?: number }>, { size: 18, strokeWidth: 1.8 })}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full h-[46px] rounded-md border text-sm text-slate-800 bg-white transition-all duration-200 outline-none",
              icon ? "pl-[42px]" : "pl-3",
              isPassword ? "pr-[42px]" : "pr-3",
              error 
                ? "border-red-400 focus:border-red-400 focus:ring-[3px] focus:ring-red-100" 
                : "border-slate-200 focus:border-brand-400 focus:ring-[3px] focus:ring-brand-400/15",
              className
            )}
            {...props}
          />

          {/* Botón de ver contraseña */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
            </button>
          )}
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <div className="mt-1.5 flex items-center gap-1 text-[12px] text-red-600">
            <span className="text-red-500 text-xs">●</span> {error}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';