// Keeps the far-to-near drawing order up to date while the shapes turn. It
// holds the splats' positions (sent once per scene) and, for each request,
// places them with the shapes' current centres and spin, measures their
// distance to the camera and sorts. Sorting a few hundred thousand splats
// takes tens of milliseconds, which is why it happens off the main thread.

type Init = { type: "init"; local: Float32Array; shape: Uint8Array };
type Sort = { type: "sort"; id: number; centres: Float32Array; turns: Float32Array; camera: number };

const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<Init | Sort>) => void) | null;
  postMessage: (message: unknown, transfer: Transferable[]) => void;
};

let local: Float32Array = new Float32Array(0);
let shape: Uint8Array = new Uint8Array(0);

ctx.onmessage = (e) => {
  const m = e.data;
  if (m.type === "init") {
    local = m.local;
    shape = m.shape;
    return;
  }
  const n = shape.length;
  const { centres, turns, camera } = m;
  // Distances as keys packed with the index, so a plain numeric sort works
  // (much faster than sorting with a comparator).
  const keys = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const s = shape[i];
    const e9 = s * 9;
    const c4 = s * 4;
    const lx = local[i * 3];
    const ly = local[i * 3 + 1];
    const lz = local[i * 3 + 2];
    const sc = centres[c4 + 3];
    const x = centres[c4] + (turns[e9] * lx + turns[e9 + 3] * ly + turns[e9 + 6] * lz) * sc;
    const y = centres[c4 + 1] + (turns[e9 + 1] * lx + turns[e9 + 4] * ly + turns[e9 + 7] * lz) * sc;
    const z = centres[c4 + 2] + (turns[e9 + 2] * lx + turns[e9 + 5] * ly + turns[e9 + 8] * lz) * sc;
    const dz = camera - z;
    // Furthest first: sort ascending on negative distance.
    const d = Math.min(Math.sqrt(x * x + y * y + dz * dz), 1000);
    keys[i] = Math.floor((1000 - d) * 1000) * 1048576 + i;
  }
  keys.sort();
  const order = new Uint32Array(n);
  for (let i = 0; i < n; i++) order[i] = keys[i] % 1048576;
  ctx.postMessage({ id: m.id, order }, [order.buffer]);
};
