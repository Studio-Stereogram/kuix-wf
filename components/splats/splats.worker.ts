// All the heavy work for the backdrop, off the main thread:
// - build: turns a scene into splats (a few hundred milliseconds for a few
//   hundred thousand splats), places the shapes and works out the first
//   drawing order. The splats go back to the page; the worker keeps their
//   positions for later sorts.
// - place: the frame changed shape; new centres and a new order.
// - sort: the shapes have turned; a new far-to-near order (tens of
//   milliseconds), asked for a few times a second.
import { build, depthOrder, place, type Frame, type Splats } from "@/lib/splats/build";
import type { SplatScene } from "@/lib/splats/spec";

type Build = { type: "build"; id: number; scene: SplatScene; budget: number; grainDensity: number; frame: Frame };
type Place = { type: "place"; id: number; frame: Frame };
type Sort = { type: "sort"; id: number; turns: Float32Array };

const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<Build | Place | Sort>) => void) | null;
  postMessage: (message: unknown, transfer: Transferable[]) => void;
};

let scene: SplatScene | null = null;
let local: Float32Array = new Float32Array(0);
let shape: Uint8Array = new Uint8Array(0);
let centres: Float32Array = new Float32Array(0);
let camera = 10;

ctx.onmessage = (e) => {
  const m = e.data;
  if (m.type === "build") {
    const splats: Splats = build(m.scene, m.budget, m.grainDensity);
    scene = m.scene;
    local = splats.local.slice();
    shape = splats.shape.slice();
    camera = m.frame.camera;
    centres = place(m.scene, m.frame);
    const order = depthOrder(local, shape, centres, null, camera);
    const transfer = [
      splats.local, splats.normal, splats.shape, splats.kind, splats.color,
      splats.size, splats.stretch, splats.angle, splats.seed, order,
    ].map((a) => a.buffer);
    ctx.postMessage({ type: "built", id: m.id, splats, centres: centres.slice(), order }, transfer);
    return;
  }
  if (!scene) return;
  if (m.type === "place") {
    camera = m.frame.camera;
    centres = place(scene, m.frame);
    const order = depthOrder(local, shape, centres, null, camera);
    ctx.postMessage({ type: "placed", id: m.id, centres: centres.slice(), order }, [order.buffer]);
    return;
  }
  const order = depthOrder(local, shape, centres, m.turns, camera);
  ctx.postMessage({ type: "sorted", id: m.id, order }, [order.buffer]);
};
