import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ControlButtonProps {
  label: string;
  icon?: LucideIcon;
  variant?: "primary" | "success" | "warning" | "destructive" | "accent" | "info" | "ar" | "ghost";
  onClick: () => void;
  className?: string;
}

const variantClasses: Record<string, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft",
  success: "bg-success text-success-foreground hover:bg-success/90 shadow-soft",
  warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-soft",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft",
  accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-soft",
  info: "bg-info text-info-foreground hover:bg-info/90 shadow-soft",
  ar: "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow",
  ghost: "border border-border bg-secondary text-secondary-foreground hover:bg-muted",
};

const ControlButton = ({ label, icon: Icon, variant = "primary", onClick, className = "" }: ControlButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-tight transition-colors ${variantClasses[variant]} ${className}`}
  >
    {Icon && <Icon className="h-4 w-4" />}
    {label}
  </motion.button>
);

export default ControlButton;
