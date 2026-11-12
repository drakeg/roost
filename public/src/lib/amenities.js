export const AMENITIES = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "parking", label: "Free parking" },
  { value: "kitchen", label: "Kitchen" },
  { value: "pets", label: "Pet friendly" },
  { value: "workspace", label: "Dedicated workspace" },
  { value: "laundry", label: "Washer / dryer" },
  { value: "air-conditioning", label: "Air conditioning" },
  { value: "fireplace", label: "Fireplace" },
  { value: "hot-tub", label: "Hot tub" },
  { value: "ev-charger", label: "EV charger" },
];

const ALLOWED_AMENITIES = new Set(AMENITIES.map((amenity) => amenity.value));

export function parseAmenities(values) {
  const list = Array.isArray(values) ? values : [values];

  return [...new Set(
    list
      .map((value) => String(value ?? "").trim())
      .filter((value) => ALLOWED_AMENITIES.has(value))
  )];
}

export function amenityLabel(value) {
  return AMENITIES.find((amenity) => amenity.value === value)?.label ?? value;
}
