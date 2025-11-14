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
    "rounded-md px-4 py-2 text-sm font-semibold tracking-tight focus:outline-none " +
    "disabled:opacity-50 disabled:cursor-not-allowed transition-all";

  const variants = {
    primary:
      "bg-[#FF7900] text-white shadow-sm hover:bg-[#ff8f26] active:bg-[#e86f00]",
    ghost:
      "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 active:bg-gray-200",
    dark: "bg-black text-white hover:bg-neutral-800 active:bg-neutral-900",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      whileHover={!disabled ? { scale: 1.03 } : {}}
      transition={{ duration: 0.15 }}
      className={`${base} ${variants[kind]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
