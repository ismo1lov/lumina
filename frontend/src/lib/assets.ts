const modules = import.meta.glob("../assets/**/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export function resolveAsset(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path) || path.startsWith("/uploads")) return path;
  if (path.startsWith("/src/assets/")) {
    const rel = `../assets/${path.slice("/src/assets/".length)}`;
    return modules[rel] || undefined;
  }
  return path;
}
