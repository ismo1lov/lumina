import { useEffect, useState } from "react";
import { digitsOf, formatUzPhone, isValidUzPhone } from "@/lib/phone";
import { useI18n } from "@/lib/i18n";

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  showHint?: boolean;
  invalid?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  required,
  className,
  labelClassName = "eyebrow",
  showHint = true,
  invalid = false,
}: PhoneInputProps) {
  const { t } = useI18n();
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    onChange(formatUzPhone(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const digits = digitsOf(value);
  const complete = digits.length === 9;
  const valid = complete && isValidUzPhone(value);
  const showError = (touched || invalid) && digits.length > 0 && !valid;
  const showIncomplete = (touched || invalid) && digits.length > 0 && !complete;

  return (
    <label className="block">
      <span className={labelClassName}>{t("Phone")}</span>
      <input
        type="tel"
        inputMode="numeric"
        required={required}
        placeholder="+998 ** *** ** **"
        value={value}
        autoComplete="tel"
        onChange={(e) => onChange(formatUzPhone(e.target.value))}
        onBlur={() => setTouched(true)}
        className={`mt-2 w-full border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent ${
          showError ? "border-red-400" : "border-input"
        } ${className ?? ""}`}
      />
      {showHint && (showError || showIncomplete) && (
        <span className="mt-1 block text-[11px] text-red-500">
          {showError
            ? t("Enter a valid Uzbekistan number (e.g. +998 90 123 45 67)")
            : t("Enter the full number")}
        </span>
      )}
    </label>
  );
}
