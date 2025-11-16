import { useEffect, useRef } from "react";
import TextInput from "./TextInput.jsx";

/**
 * Champ adresse avec autocomplétion Google Maps + géolocalisation
 */
export default function AddressInput({ label, value, onChange }) {
  const inputRef = useRef(null);

  useEffect(() => {
    // Google pas encore chargé → on stoppe
    if (!window.google?.maps?.places) return;

    // Configuration Autocomplete
    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["address"],
        componentRestrictions: { country: ["fr"] },
        fields: ["formatted_address", "geometry"],
      }
    );

    // Listener
    const handlePlace = () => {
      const place = autocomplete.getPlace();
      if (!place || !place.formatted_address) return;

      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      onChange({
        address: place.formatted_address,
        lat,
        lng,
      });
    };

    autocomplete.addListener("place_changed", handlePlace);

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [onChange]);

  return (
    <div className="w-full">
      <TextInput
        label={label}
        value={value}
        onChange={(val) => onChange({ address: val })}
        inputRef={inputRef}
        placeholder="Ex : 12 Rue de la Paix, Paris"
      />
    </div>
  );
}
