import { motion, AnimatePresence } from "framer-motion";

interface StatusBannerProps {
  message: string;
  type?: "success" | "error" | "info";
}

const typeClasses = {
  success: "border-success/30 bg-success/10 text-success",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-info/30 bg-info/10 text-info",
};

const StatusBanner = ({ message, type = "info" }: StatusBannerProps) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={`rounded-lg border-2 px-5 py-3 text-center font-mono text-sm font-semibold ${typeClasses[type]}`}
    >
      {message}
    </motion.div>
  </AnimatePresence>
);

export default StatusBanner;
