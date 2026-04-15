import { motion } from "framer-motion";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  gradient?: boolean;
}

const SectionCard = ({ title, icon: Icon, children, className = "", gradient }: SectionCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`rounded-xl border border-border bg-card p-6 ${gradient ? "bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20" : ""} ${className}`}
  >
    <h3 className="mb-4 flex items-center gap-2 font-mono text-lg font-semibold text-card-foreground">
      {Icon && <Icon className="h-5 w-5 text-primary" />}
      {title}
    </h3>
    {children}
  </motion.div>
);

export default SectionCard;
