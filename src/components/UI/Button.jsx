import { motion } from "framer-motion";

export default function Button({
  children,
  onClick,
  kind = "primary",
  type = "button",
  className = "",
  disabled = false,
}) {
  const base =
    "rounded-xl px-3 py-2 text-sm font-semibold shadow disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-[#FF7900] text-white hover:brightness-110",
    ghost: "bg-white text-gray-800 border hover:bg-gray-50",
    dark: "bg-black text-white hover:brightness-110",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${styles[kind]} transition ${className}`}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      whileHover={disabled ? {} : { y: -1 }}
    >
      {children}
    </motion.button>
  );
}
