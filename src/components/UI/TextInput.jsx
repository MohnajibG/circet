export default function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <label className="block mb-2">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
      />
    </label>
  );
}
