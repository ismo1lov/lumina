import { useEffect, useRef, useState } from "react";
import { Briefcase, ChevronDown, Home, MapPin, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useConfirm } from "@/lib/use-confirm";
import { PhoneInput } from "@/components/site/PhoneInput";
import { AddressMapPreview } from "@/components/account/AddressMapPreview";
import { YandexMap } from "@/components/site/YandexMap";
import { isValidUzPhone } from "@/lib/phone";
import { geocodeAddress, reverseGeocode } from "@/lib/geocode";

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  lat: string | null;
  lng: string | null;
  isDefault: boolean;
}

interface AddressForm {
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

const emptyForm = (name: string): AddressForm => ({
  label: "Home",
  fullName: name,
  phone: "",
  address: "",
  city: "",
  lat: 41.2995,
  lng: 69.2401,
  isDefault: false,
});

const fieldLabelClass =
  "text-xs font-medium tracking-[0.02em] text-muted-foreground first-letter:uppercase";

export function AddressBook() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { confirm, dialog } = useConfirm();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm(user?.name ?? ""));
  const [saving, setSaving] = useState(false);
  const [phoneInvalid, setPhoneInvalid] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const skipGeocodeRef = useRef(false);
  const reverseRequestRef = useRef(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    api
      .get<Address[]>("/addresses")
      .then((rows) => {
        if (!active) return;
        setAddresses(rows);
        if (rows.length === 0) {
          setForm(emptyForm(user.name));
          setFormOpen(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    setSelectedAddressId((current) => {
      if (current && addresses.some((address) => address.id === current)) return current;
      return addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? null;
    });
  }, [addresses]);

  const handleMapChange = (lat: number, lng: number) => {
    setForm((prev) => ({ ...prev, lat, lng }));
    const requestId = ++reverseRequestRef.current;

    void reverseGeocode(lat, lng).then((place) => {
      if (!place || requestId !== reverseRequestRef.current) return;
      setForm((prev) => {
        const address = place.address || prev.address;
        const city = place.city || prev.city;
        if (!address && !city) return prev;
        if (address === prev.address && city === prev.city) return prev;

        skipGeocodeRef.current = true;
        return { ...prev, address, city };
      });
    });
  };

  // Keep the map centred on the address the user types.
  useEffect(() => {
    if (!formOpen) return;
    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false;
      return;
    }
    const query = `${form.address} ${form.city}`.trim();
    if (!query) return;

    const timer = setTimeout(async () => {
      const results = await geocodeAddress(query);
      if (results.length === 0) return;
      const place = results[0];
      setForm((prev) =>
        prev.lat !== place.lat || prev.lng !== place.lng
          ? { ...prev, lat: place.lat, lng: place.lng }
          : prev,
      );
    }, 900);

    return () => clearTimeout(timer);
  }, [form.address, form.city, formOpen]);

  const editAddress = (address: Address) => {
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      lat: Number(address.lat) || 41.2995,
      lng: Number(address.lng) || 69.2401,
      isDefault: address.isDefault,
    });
    setPhoneInvalid(false);
    setEditingId(address.id);
    setFormOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(emptyForm(user?.name ?? ""));
    setPhoneInvalid(false);
    setFormOpen(addresses.length === 0);
  };

  const saveAddress = async () => {
    setPhoneInvalid(false);
    if (!isValidUzPhone(form.phone)) {
      setPhoneInvalid(true);
      toast.error(t("Please enter a complete and valid phone number (+998 ** *** ** **)"));
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/addresses/${editingId}`, form);
      } else {
        await api.post("/addresses", form);
      }
      const updated = await api.get<Address[]>("/addresses");
      setAddresses(updated);
      setEditingId(null);
      setForm(emptyForm(user?.name ?? ""));
      setFormOpen(false);
      toast.success(t("Address saved"));
    } catch (err) {
      toast.error(err instanceof Error ? t(err.message) : t("Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (address: Address) => {
    const ok = await confirm({
      title: t("Delete address?"),
      description: t("Are you sure you want to delete this address?"),
      confirmLabel: t("Delete"),
      destructive: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/addresses/${address.id}`);
      const remaining = addresses.filter((item) => item.id !== address.id);
      setAddresses(remaining);
      if (editingId === address.id || remaining.length === 0) {
        setEditingId(null);
        setForm(emptyForm(user?.name ?? ""));
        setFormOpen(remaining.length === 0);
      }
      toast.success(t("Address deleted"));
    } catch (err) {
      toast.error(err instanceof Error ? t(err.message) : t("Failed to delete address"));
    }
  };

  const addressLabel = (label: string) => {
    if (label === "Home") return t("Home address");
    if (label === "Work") return t("Work address");
    return t("Other address");
  };

  const labelIcon = (label: string) => {
    if (label === "Work") return Briefcase;
    if (label === "Other") return MapPin;
    return Home;
  };

  const selectedAddress =
    addresses.find((address) => address.id === selectedAddressId) ?? addresses[0] ?? null;

  const saveDisabled =
    saving ||
    form.fullName.trim().length < 2 ||
    form.address.trim().length < 5 ||
    form.city.trim().length < 2;

  return (
    <div>
      <div>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-44 animate-pulse border border-border/70 bg-card" />
            ))}
          </div>
        ) : addresses.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid content-start gap-3">
              {addresses.map((address) => {
                const Icon = labelIcon(address.label);
                const isSelected = selectedAddress?.id === address.id;
                const addressLines = address.address
                  .split(/[\n,]+/)
                  .map((part) => part.trim())
                  .filter(
                    (part) => part && part.toLowerCase() !== address.city.trim().toLowerCase(),
                  );
                return (
                  <article
                    key={address.id}
                    onClick={() => setSelectedAddressId(address.id)}
                    className={`group flex min-h-[240px] cursor-pointer flex-col border bg-card p-6 transition-all duration-300 hover:shadow-soft ${
                      isSelected ? "border-accent ring-1 ring-accent/15" : "border-border/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center border border-border/70 bg-cream text-accent">
                          <Icon size={15} strokeWidth={1.6} />
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {address.phone}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            editAddress(address);
                          }}
                          aria-label={t("Edit Address")}
                          className="grid size-8 cursor-pointer place-items-center text-muted-foreground transition-colors hover:bg-cream hover:text-foreground"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void deleteAddress(address);
                          }}
                          aria-label={t("Delete")}
                          className="grid size-8 cursor-pointer place-items-center text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1">
                      <p className="text-sm font-medium text-foreground">{address.city}</p>
                      {addressLines.map((line, index) => (
                        <p
                          key={`${address.id}-${index}`}
                          className="text-sm leading-relaxed text-muted-foreground"
                        >
                          {line}
                        </p>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                      <span className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                        {addressLabel(address.label)}
                      </span>
                      {address.isDefault && (
                        <span className="bg-primary px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-primary-foreground">
                          {t("Default")}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="relative min-h-[230px] overflow-hidden border border-border/80 bg-cream lg:min-h-0">
              {selectedAddress && (
                <AddressMapPreview
                  lat={Number(selectedAddress.lat) || 41.2995}
                  lng={Number(selectedAddress.lng) || 69.2401}
                  ariaLabel={`${selectedAddress.address}, ${selectedAddress.city}`}
                  className="absolute inset-0 z-0"
                />
              )}
              {selectedAddress && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/65 via-black/25 to-transparent px-4 pt-10 pb-3">
                  <p className="truncate text-sm font-medium text-white">
                    {selectedAddress.address}
                  </p>
                  <p className="truncate text-xs text-white/80">{selectedAddress.city}</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {formOpen && (
        <div ref={formRef} className="mt-5 scroll-mt-28 border border-border/80 bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h4 className="font-display text-xl">
              {editingId ? t("Edit Address") : t("Add Address")}
            </h4>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={closeForm}
                aria-label={t("Cancel")}
                className="grid size-8 cursor-pointer place-items-center text-muted-foreground transition-colors hover:bg-cream hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={fieldLabelClass}>{t("Label")}</span>
              <div className="relative mt-2">
                <select
                  value={form.label}
                  onChange={(event) => setForm({ ...form, label: event.target.value })}
                  className="w-full appearance-none border border-input bg-background px-3 py-2.5 pr-9 text-sm outline-none focus:border-accent"
                >
                  <option value="Home">{addressLabel("Home")}</option>
                  <option value="Work">{addressLabel("Work")}</option>
                  <option value="Other">{addressLabel("Other")}</option>
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </label>

            <label className="block">
              <span className={fieldLabelClass}>{t("Full name")}</span>
              <input
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                className="mt-2 w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>

            <PhoneInput
              value={form.phone}
              onChange={(value) => setForm({ ...form, phone: value })}
              invalid={phoneInvalid}
              labelClassName={fieldLabelClass}
            />

            <label className="block">
              <span className={fieldLabelClass}>{t("City")}</span>
              <input
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                className="mt-2 w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className={fieldLabelClass}>{t("Address")}</span>
              <textarea
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                rows={2}
                className="mt-2 w-full resize-none border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>

            <div className="sm:col-span-2">
              <span className={fieldLabelClass}>{t("Location on map")}</span>
              <YandexMap
                lat={form.lat}
                lng={form.lng}
                zoom={13}
                interactive
                onChange={handleMapChange}
                title={t("Location on map")}
                className="mt-2 h-52 w-full border border-border"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {t("Click on the map or drag the marker to set your exact location.")}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveAddress}
              disabled={saveDisabled}
              className="bg-primary px-6 py-2.5 text-[10px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? t("Saving...") : editingId ? t("Update Address") : t("Save Address")}
            </button>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={closeForm}
                className="cursor-pointer text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {t("Cancel")}
              </button>
            )}
          </div>
        </div>
      )}

      {dialog}
    </div>
  );
}
