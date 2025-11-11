import { useEffect, useRef } from "react";
import TextInput from "./TextInput.jsx";

/**
 * Champ adresse avec autocomplétion Google Maps + géolocalisation
 *
 * @param {string} label - Libellé du champ
 * @param {string} value - Valeur actuelle (adresse)
 * @param {(data: { address: string, lat?: number, lng?: number }) => void} onChange - Callback quand l’adresse change
 */
export default function AddressInput({ label, value, onChange }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!window.google || !window.google.maps) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["address"],
        componentRestrictions: { country: ["fr"] }, // 🇫🇷 limiter à la France
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.formatted_address) return;

      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      onChange({
        address: place.formatted_address,
        lat,
        lng,
      });
    });
  }, [onChange]);

  return (
    <div className="w-full">
      <TextInput
        label={label}
        value={value}
        onChange={(val) => onChange({ address: val })}
        inputRef={inputRef}
        placeholder="Ex: 12 Rue de la Paix, Paris"
      />
    </div>
  );
}
