import type { ReactNode } from "react";

/** Labeled text input for admin forms. */
export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="field-label">
        {label}{" "}
        {optional && <span className="font-normal text-muted">(optional)</span>}
      </span>
      <input
        className="field"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

/** Labeled select for admin forms. */
export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="rounded-lg border border-rust-line bg-rust-soft px-3.5 py-2.5 text-sm text-rust">
      {children}
    </div>
  );
}
