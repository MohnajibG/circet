import { motion } from "framer-motion";

export default function TextInput({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  icon = null,
  error = "",
  disabled = false,
  className = "",
}) {
  return (
    <label className={`block w-full ${className}`}>
      {/* Label */}
      {label && (
        <span className="block text-sm font-semibold text-gray-800 mb-1">
          {label}
        </span>
      )}

      {/* Input container */}
      <motion.div
        initial={{ scale: 1 }}
        whileFocus={{ scale: 1.01 }}
        className={`
          flex items-center gap-2 
          rounded-md border bg-white 
          px-3 py-2 shadow-sm
          transition-all
          ${
            error
              ? "border-red-500 focus-within:ring-red-400"
              : "border-gray-300 focus-within:ring-[#FF7900]"
          }
          ${disabled ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        {icon && <div className="text-gray-400">{icon}</div>}

        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
        />
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-600 mt-1"
        >
          {error}
        </motion.div>
      )}
    </label>
  );
}
