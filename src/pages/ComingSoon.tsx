export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">{title}</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-2">This page is coming soon.</p>
    </div>
  );
}