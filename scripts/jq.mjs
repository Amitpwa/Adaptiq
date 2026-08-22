// Minimal JSON path reader for the flow-walk script: reads stdin, evaluates a
// dotted path, prints the value or an empty string. Avoids a jq dependency.
let raw = '';
process.stdin.on('data', (d) => (raw += d)).on('end', () => {
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    process.stdout.write('');
    return;
  }
  for (const key of process.argv[2].split('.').filter(Boolean)) {
    if (value == null) break;
    value = value[key];
  }
  if (value == null) { process.stdout.write(''); return; }
  process.stdout.write(typeof value === 'number' ? String(value) : String(value));
});
