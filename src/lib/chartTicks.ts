export function yearTickLabels(labels: string[]) {
  const firstOfYear: string[] = [];
  let previous = "";
  for (const label of labels) {
    const year = label.slice(0, 4);
    if (year !== previous) {
      firstOfYear.push(label);
      previous = year;
    }
  }
  const step = firstOfYear.length > 10 ? 2 : 1;
  return firstOfYear.filter((_, index) => index % step === 0);
}

export function yearLabel(value: string) {
  return value.slice(0, 4);
}
