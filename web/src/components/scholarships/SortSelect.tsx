'use client';

/**
 * Directory sort selector (port of the Django directory.html sort form).
 * Client component because it submits on change; hidden inputs preserve the
 * active filters when the form posts (Django parity).
 */
export function SortSelect({
  defaultValue,
  hiddenInputs,
}: {
  defaultValue: string;
  hiddenInputs: Array<[string, string]>;
}) {
  return (
    <form method="get" className="flex items-center gap-2 text-sm">
      {hiddenInputs.map(([key, value]) => (
        <input key={`${key}-${value}`} type="hidden" name={key} value={value} />
      ))}
      <label htmlFor="ordering" className="text-muted-foreground">
        Sort:
      </label>
      <select
        id="ordering"
        name="ordering"
        defaultValue={defaultValue}
        onChange={(e) => e.target.form?.submit()}
        className="input !w-auto py-1.5"
      >
        <option value="score">Score (best fit)</option>
        <option value="deadline">Deadline (soonest)</option>
        <option value="name">Name A–Z</option>
        <option value="updated">Recently updated</option>
      </select>
    </form>
  );
}
