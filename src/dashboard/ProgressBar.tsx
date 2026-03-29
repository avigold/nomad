interface Props {
  percentage: number; // 0-100
}

export function ProgressBar({ percentage }: Props): JSX.Element {
  const clamped = Math.min(percentage, 100);
  const width = `${clamped}%`;

  let color: string;
  if (clamped >= 85) {
    color = 'bg-red-500';
  } else if (clamped >= 60) {
    color = 'bg-amber-400';
  } else {
    color = 'bg-emerald-500';
  }

  return (
    <div className="bg-gray-700 rounded-full h-2 w-full">
      <div className={`${color} rounded-full h-2 transition-all`} style={{ width }} />
    </div>
  );
}
