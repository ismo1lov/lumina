import { useEffect, useState } from "react";
import { digitsOf, formatUzPhone, isValidUzPhone } from "@/lib/phone";

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
  showHint?: boolean;
  invalid?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  required,
  className,
  showHint = true,
  invalid = false,
}: PhoneInputProps) {
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
      <span className="eyebrow">Phone</span>
      <input
        type="tel"
        inputMode="numeric"
        required={required}
        placeholder="+998 ** *** ** **"
        value={value}
        autoComplete="tel"
        onChange={(e) => onChange(formatUzPhone(e.target.value))}
        onBlur={() => setTouched(true)}
        className={`mt-2 w-full border-b bg-transparent py-2 text-sm outline-none focus:border-accent ${
          showError ? "border-red-400" : ""
        } ${className ?? ""}`}
      />
      {showHint && (showError || showIncomplete) && (
        <span className="mt-1 block text-[11px] text-red-500">
          {showError
            ? "To'g'ri O'zbekiston raqamini kiriting (masalan +998 90 123 45 67)"
            : "Raqamni to'liq kiriting"}
        </span>
      )}
    </label>
  );
}
