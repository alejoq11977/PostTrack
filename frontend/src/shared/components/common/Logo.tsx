import { cn } from '@/shared/utils/cn';
import logoImage from '@/assets/Logo_posttrack.png'; 

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export const Logo = ({ className, alt = "PostTrack Logo", ...props }: LogoProps) => {
  return (
    <img
      src={logoImage}
      alt={alt}
      className={cn("object-contain shrink-0", className)}
      {...props}
    />
  );
};