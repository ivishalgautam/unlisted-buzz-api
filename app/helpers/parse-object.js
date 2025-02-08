export function parseObj(obj) {
  return JSON.parse(
    String(obj)
      .trim()
      .replace(/[^}\]]*$/, "")
  );
}
