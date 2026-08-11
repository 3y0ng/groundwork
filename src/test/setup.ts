// Minimal localStorage shim so the persisted zustand store can be imported in a
// plain Node test environment without pulling in jsdom.
class MemStorage {
  private m = new Map<string, string>()
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string) { this.m.set(k, String(v)) }
  removeItem(k: string) { this.m.delete(k) }
  clear() { this.m.clear() }
  key(i: number) { return [...this.m.keys()][i] ?? null }
  get length() { return this.m.size }
}

if (!('localStorage' in globalThis)) {
  ;(globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage()
}
