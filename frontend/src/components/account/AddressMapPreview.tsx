import { YandexMap } from "@/components/site/YandexMap";

interface AddressMapPreviewProps {
  lat: number;
  lng: number;
  ariaLabel?: string;
  className?: string;
}

export function AddressMapPreview({ lat, lng, ariaLabel, className }: AddressMapPreviewProps) {
  return (
    <YandexMap
      lat={lat}
      lng={lng}
      zoom={15}
      title={ariaLabel}
      className={`h-full w-full ${className ?? ""} border-0`}
    />
  );
}
