type Props = {
  value: number;
};

export default function ProgressBar({ value }: Props) {
  const safeValue = Math.max(0, Math.min(value, 100));

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className="h-full rounded-full bg-black transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}