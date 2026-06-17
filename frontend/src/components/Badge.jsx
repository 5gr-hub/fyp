const variants = {
  emergency:          { cls: 'bg-red-50 text-red-700 border-red-200',        dot: 'bg-red-500' },
  urgent:             { cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  routine:            { cls: 'bg-slate-100 text-slate-600 border-slate-200',   dot: 'bg-slate-400' },
  draft:              { cls: 'bg-slate-100 text-slate-500 border-slate-200',   dot: 'bg-slate-300' },
  submitted:          { cls: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  acknowledged:       { cls: 'bg-cyan-50 text-cyan-700 border-cyan-200',      dot: 'bg-cyan-500' },
  in_transit:         { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  received:           { cls: 'bg-teal-50 text-teal-700 border-teal-200',      dot: 'bg-teal-500' },
  completed:          { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  cancelled:          { cls: 'bg-red-50 text-red-600 border-red-200',         dot: 'bg-red-400' },
  scheduled:          { cls: 'bg-cyan-50 text-cyan-700 border-cyan-200',      dot: 'bg-cyan-500' },
  confirmed:          { cls: 'bg-teal-50 text-teal-700 border-teal-200',      dot: 'bg-teal-500' },
  attended:           { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  missed:             { cls: 'bg-red-50 text-red-700 border-red-200',         dot: 'bg-red-500' },
  treated_discharged: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  admitted:           { cls: 'bg-cyan-50 text-cyan-700 border-cyan-200',      dot: 'bg-cyan-500' },
  referred_further:   { cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  deceased:           { cls: 'bg-slate-100 text-slate-600 border-slate-300',  dot: 'bg-slate-400' },
  dna:                { cls: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  other:              { cls: 'bg-slate-100 text-slate-500 border-slate-200',  dot: 'bg-slate-300' },
};

const fallback = { cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };

export default function Badge({ value, className = '' }) {
  const { cls, dot } = variants[value] ?? fallback;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${cls} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {value?.replace(/_/g, ' ')}
    </span>
  );
}
