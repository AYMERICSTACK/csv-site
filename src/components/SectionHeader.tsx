export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700">
          <span className="h-2 w-2 rounded-full bg-csv-orange" />
          {eyebrow}
        </div>
      )}
      <h2 className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base md:text-lg leading-relaxed text-neutral-700">
          {subtitle}
        </p>
      )}
    </div>
  );
}
