import visaLogo from "@/assets/payments/visa.svg";
import paymeLogo from "@/assets/payments/payme.svg";
import clickLogo from "@/assets/payments/click.svg";

export type PaymentBrand = "visa" | "payme" | "click";

const brands: { id: PaymentBrand; label: string; src: string }[] = [
  { id: "visa", label: "Visa", src: visaLogo },
  { id: "payme", label: "Payme", src: paymeLogo },
  { id: "click", label: "Click", src: clickLogo },
];

export function PaymentLogos({
  className = "",
  imageClassName = "h-7 w-[72px]",
  exclude = [],
}: {
  className?: string;
  imageClassName?: string;
  exclude?: PaymentBrand[];
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {brands
        .filter((brand) => !exclude.includes(brand.id))
        .map((brand) => (
          <span
            key={brand.id}
            className="inline-flex overflow-hidden rounded-[4px] bg-white p-1 shadow-sm ring-1 ring-black/5"
          >
            <img
              src={brand.src}
              alt={brand.label}
              width={96}
              height={32}
              loading="lazy"
              className={`${imageClassName} object-contain`}
            />
          </span>
        ))}
    </div>
  );
}

export function PaymentBrandLogo({
  brand,
  className = "h-7 w-[72px]",
}: {
  brand: PaymentBrand;
  className?: string;
}) {
  const item = brands.find((entry) => entry.id === brand);
  if (!item) return null;
  return (
    <span className="inline-flex overflow-hidden rounded-[4px] bg-white p-1 shadow-sm ring-1 ring-black/5">
      <img
        src={item.src}
        alt={item.label}
        width={96}
        height={32}
        loading="lazy"
        className={`${className} object-contain`}
      />
    </span>
  );
}
