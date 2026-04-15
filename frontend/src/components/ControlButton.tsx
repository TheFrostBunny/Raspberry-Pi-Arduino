import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ControlButtonProps {
  label: string;
  icon?: LucideIcon;
  variant?: "primary" | "success" | "warning" | "destructive" | "accent" | "info" | "ar";
  onClick: () => void;
  className?: string;
}

const variantClasses: Record<string, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary",
  success: "bg-success text-success-foreground hover:bg-success/90",
  warning: "bg-warning text-warning-foreground hover:bg-warning/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 glow-danger",
  accent: "bg-accent text-accent-foreground hover:bg-accent/90 glow-accent",
  info: "bg-info text-info-foreground hover:bg-info/90",
  ar: "bg-gradient-to-r from-destructive to-warning text-destructive-foreground",
};

const ControlButton = ({ label, icon: Icon, variant = "primary", onClick, className = "" }: ControlButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.03, y: -2 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-mono text-sm font-semibold transition-shadow ${variantClasses[variant]} ${className}`}
  >
    {Icon && <Icon className="h-4 w-4" />}
    {label}
  </motion.button>
);

export default ControlButton;
