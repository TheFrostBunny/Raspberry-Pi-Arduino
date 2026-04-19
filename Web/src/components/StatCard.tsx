import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: "primary" | "accent" | "warning" | "info" | "destructive";
}

const colorMap = {
  primary: "text-primary bg-primary/10",
  accent: "text-accent bg-accent/10",
  warning: "text-warning bg-warning/10",
  info: "text-info bg-info/10",
  destructive: "text-destructive bg-destructive/10",
};

const StatCard = ({ icon: Icon, value, label, color = "primary" }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-border bg-card p-5 shadow-soft"
  >
    <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${colorMap[color]}`}>
      <Icon className="h-4.5 w-4.5" />
    </div>
    <div className="text-3xl font-semibold tracking-tight text-card-foreground">{value}</div>
    <div className="mt-1 text-sm text-muted-foreground">{label}</div>
  </motion.div>
);

export default StatCard;
