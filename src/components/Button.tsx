import Link from "next/link";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
};

export default function Button({ href, children, variant = "primary" }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition";
  const styles =
    variant === "primary"
      ? "bg-csv-orange text-white hover:opacity-90"
      : "border border-neutral-200 hover:bg-neutral-50";

  return (
    <Link className={`${base} ${styles}`} href={href}>
      {children}
    </Link>
  );
}
