import { motion } from "framer-motion";

export default function Select({ label, value, onChange, options }) {
  return (
    <label className="block mb-2">
      <span className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </span>

      <motion.select
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full rounded-md border border-gray-300 
          bg-white px-3 py-2
          text-gray-800 text-sm
          shadow-sm
          outline-none
          focus:border-orange-500
          focus:ring-2 focus:ring-orange-400/60
          transition-all
        "
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-gray-800">
            {opt.label}
          </option>
        ))}
      </motion.select>
    </label>
  );
}
