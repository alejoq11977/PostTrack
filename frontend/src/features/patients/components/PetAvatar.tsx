import { PawPrint } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface PetAvatarProps {
  photoUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const PetAvatar = ({ photoUrl, name, size = 'md', className }: PetAvatarProps) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  const iconSizes = { sm: 20, md: 24, lg: 32, xl: 40 };

  return (
    <div className={cn(
      "rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm",
      sizeClasses[size],
      className
    )}>
      {photoUrl ? (
        <img src={photoUrl} alt={`Foto de ${name}`} className="w-full h-full object-cover" />
      ) : (
        <PawPrint size={iconSizes[size]} className="text-brand-300" />
      )}
    </div>
  );
};