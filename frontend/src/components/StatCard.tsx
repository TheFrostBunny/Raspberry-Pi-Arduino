import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: "primary" | "accent" | "warning" | "info" | "destructive";
}

const colorMap = {
  primary: "text-primary border-primary/20 bg-primary/5",
  accent: "text-accent border-accent/20 bg-accent/5",
  warning: "text-warning border-warning/20 bg-warning/5",
  info: "text-info border-info/20 bg-info/5",
  destructive: "text-destructive border-destructive/20 bg-destructive/5",
};

const StatCard = ({ icon: Icon, value, label, color = "primary" }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-xl border-2 p-5 text-center ${colorMap[color]}`}
  >
    <Icon className="mx-auto mb-2 h-6 w-6" />
    <div className="font-mono text-3xl font-bold">{value}</div>
    <div className="mt-1 text-sm text-muted-foreground">{label}</div>
  </motion.div>
);

export default StatCard;
