/** JSON-LD блок в <head>. Ключ фиксированный — при повторном вызове блок заменяется, не дублируется. */
export function useJsonLd(key: string, data: Record<string, unknown>) {
  useHead({
    script: [
      {
        key: `json-ld-${key}`,
        type: "application/ld+json",
        innerHTML: JSON.stringify(data),
      },
    ],
  });
}
