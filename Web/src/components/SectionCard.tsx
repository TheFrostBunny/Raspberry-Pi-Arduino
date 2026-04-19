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
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className={`rounded-2xl border border-border bg-card p-6 shadow-soft ${
      gradient ? "bg-gradient-to-br from-primary/5 via-card to-accent/5" : ""
    } ${className}`}
  >
    <h3 className="mb-5 flex items-center gap-2.5 text-lg font-semibold tracking-tight text-card-foreground">
      {Icon && (
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      )}
      {title}
    </h3>
    {children}
  </motion.div>
);

export default SectionCard;
