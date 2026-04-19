import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

interface StatusBannerProps {
  message: string;
  type?: "success" | "error" | "info";
}

const typeClasses = {
  success: "bg-success/10 text-success",
  error: "bg-destructive/10 text-destructive",
  info: "bg-primary/10 text-primary",
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const StatusBanner = ({ message, type = "info" }: StatusBannerProps) => {
  const Icon = icons[type];
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium ${typeClasses[type]}`}
      >
        <Icon className="h-4 w-4" />
        {message}
      </motion.div>
    </AnimatePresence>
  );
};

export default StatusBanner;
