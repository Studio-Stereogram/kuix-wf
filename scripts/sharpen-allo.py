"""Sharpens the rounded corners of Allo Variable Friendly.

Allo Friendly rounds every corner with a small arc: an on-curve point, one to
three control points, another on-curve point, between two edges. The sharp
corner is where those two edges would meet. This script moves each arc's
points towards that meeting point, in the default outline and in every
weight and optical-size master, so the font stays variable and keeps the
same point count (nothing else in the font has to change). Corners that are
not clean fillets in every weight and size are left alone.

    python3 scripts/sharpen-allo.py SRC DST [STRENGTH]

STRENGTH runs from 0 (unchanged) to 1 (square corners); the default is 0.85,
which keeps a hint of softness. Needs fontTools, brotli and numpy
(pip install fonttools brotli numpy).

Allo is licensed under the SIL Open Font License 1.1 and declares no
Reserved Font Name; the result is renamed "Allo Variable Sharp" so it is not
mistaken for the original, and stays under the same licence.
"""

import math
import sys

import numpy as np
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
from fontTools.varLib.models import supportScalar

# An arc counts as a rounded corner when its chord is at most this long (font
# units, 2048 per em; Allo's corners are about 90), the edges either side
# turn by 25 to 155 degrees, and the meeting point lies close to the arc and
# about equally far from both of its ends.
MAX_CHORD = 150
MIN_TURN, MAX_TURN = math.radians(25), math.radians(155)


def intersect(a, da, b, db):
    """Where the line through a (direction da) meets the line through b."""
    cross = da[0] * db[1] - da[1] * db[0]
    if abs(cross) < 1e-9:
        return None
    t = ((b[0] - a[0]) * db[1] - (b[1] - a[1]) * db[0]) / cross
    return (a[0] + da[0] * t, a[1] + da[1] * t)


def find_corners(coords, flags, end_pts):
    """Rounded corners in one outline, as (arc indices, prev, a, b, next)."""
    found = []
    start = 0
    for end in end_pts:
        idx = list(range(start, end + 1))
        n = len(idx)
        on = [flags[i] & 1 for i in idx]
        start = end + 1
        # Round shapes with no straight edge at all (dots, rings) are left.
        if n < 4 or not any(on[k] and on[(k + 1) % n] for k in range(n)):
            continue
        for a in range(n):
            if not on[a]:
                continue
            b = (a + 1) % n
            offs = []
            while not on[b] and len(offs) < 5:
                offs.append(b)
                b = (b + 1) % n
            if not 1 <= len(offs) <= 4 or not on[b]:
                continue
            A, B = coords[idx[a]], coords[idx[b]]
            chord = math.dist(A, B)
            if not 4 <= chord <= MAX_CHORD:
                continue
            prev, nxt = (a - 1) % n, (b + 1) % n
            P0, N0 = coords[idx[prev]], coords[idx[nxt]]
            tin = (A[0] - P0[0], A[1] - P0[1])
            tout = (N0[0] - B[0], N0[1] - B[1])
            lin, lout = math.hypot(*tin), math.hypot(*tout)
            if lin < 1 or lout < 1:
                continue
            turn = math.acos(max(-1, min(1, (tin[0] * tout[0] + tin[1] * tout[1]) / (lin * lout))))
            if not MIN_TURN <= turn <= MAX_TURN:
                continue
            P = intersect(A, tin, B, tout)
            if P is None:
                continue
            ap, bp = math.dist(A, P), math.dist(B, P)
            if ap > 1.2 * chord or bp > 1.2 * chord:
                continue
            # A rounded corner is a fillet: its two ends lie the same distance
            # from the meeting point. Curved stroke ends (the top of an s)
            # are lopsided and stay as they are.
            if abs(ap - bp) > 0.2 * max(ap, bp):
                continue
            # The control points must sit inside the corner, near P.
            if any(math.dist(coords[idx[o]], P) > max(ap, bp) * 1.05 for o in offs):
                continue
            arc = [idx[a]] + [idx[o] for o in offs] + [idx[b]]
            found.append((arc, idx[prev], idx[a], idx[b], idx[nxt]))
    return found


def corner_point(coords, corner):
    _, prev, a, b, nxt = corner
    A, B, P0, N0 = coords[a], coords[b], coords[prev], coords[nxt]
    return intersect(A, (A[0] - P0[0], A[1] - P0[1]), B, (N0[0] - B[0], N0[1] - B[1]))


def fillet_in(coords, corner):
    """The meeting point, if the arc is still a fillet in this outline."""
    _, _, a, b, _ = corner
    P = corner_point(coords, corner)
    if P is None:
        return None
    A, B = coords[a], coords[b]
    chord = max(math.dist(A, B), 1)
    ap, bp = math.dist(A, P), math.dist(B, P)
    if ap > 1.3 * chord or bp > 1.3 * chord or abs(ap - bp) > 0.3 * max(ap, bp, 1):
        return None
    return P


def sharpen(src, dst, strength):
    font = TTFont(src)
    glyf, gvar = font["glyf"], font["gvar"]
    hmtx = font["hmtx"].metrics
    vmtx = font["vmtx"].metrics if "vmtx" in font else None
    keep = 1 - strength
    total = 0

    for name in font.getGlyphOrder():
        glyph = glyf[name]
        if glyph.numberOfContours <= 0:
            continue
        coords, ctrl = glyf._getCoordinatesAndControls(name, hmtx, vmtx)
        base = [tuple(c) for c in coords]
        corners = find_corners(base, glyph.flags, glyph.endPtsOfContours)
        if not corners:
            continue

        # The font stores its weights and optical sizes as adjustments, each
        # peaking at one point in the design space; some only correct the
        # combination of two others. Rebuild the real outline at each of
        # those points, sharpen it there, then solve for the adjustments that
        # give exactly the sharpened outlines.
        variations = gvar.variations.get(name, [])
        for var in variations:
            var.calcInferredDeltas(coords, ctrl.endPts)
        base_arr = np.array(base, dtype=float)
        deltas = [np.array(var.coordinates, dtype=float) for var in variations]
        peaks = [{axis: peak for axis, (_, peak, _) in var.axes.items()} for var in variations]
        weights = np.array([[supportScalar(loc, var.axes) for var in variations] for loc in peaks])
        outlines = [base_arr + sum(w * d for w, d in zip(row, deltas)) for row in weights]

        # Only corners that are fillets in every real outline.
        corners = [c for c in corners if all(fillet_in(o, c) is not None for o in [base_arr, *outlines])]
        if not corners:
            # Nothing to change: put the deltas back as they were (whole
            # numbers, implied ones left out again).
            for var in variations:
                var.coordinates = [(round(x), round(y)) for x, y in var.coordinates]
                var.optimize(coords, ctrl.endPts, tolerance=0.5)
            continue
        total += len(corners)

        def sharpened(outline):
            out = outline.copy()
            for corner in corners:
                P = np.array(fillet_in(outline, corner))
                for i in corner[0]:
                    out[i] = P + (outline[i] - P) * keep
            return out

        new_base = np.round(sharpened(base_arr))
        targets = np.stack([sharpened(o) - new_base for o in outlines])  # (peaks, points, 2)
        solved = np.linalg.solve(weights, targets.reshape(len(variations), -1)).reshape(targets.shape)
        for var, d in zip(variations, solved):
            var.coordinates = [(int(round(x)), int(round(y))) for x, y in d]

        rounded = [(int(x), int(y)) for x, y in new_base]
        n = len(glyph.coordinates)
        glyph.coordinates = GlyphCoordinates(rounded[:n])
        glyph.recalcBounds(glyf)
        for var in variations:
            var.optimize(GlyphCoordinates(rounded), ctrl.endPts, tolerance=0.5)

    names = font["name"]
    for rec in names.names:
        text = rec.toUnicode()
        if "Allo Variable Friendly" in text or "AlloVariableFriendly" in text:
            rec.string = text.replace("Allo Variable Friendly", "Allo Variable Sharp").replace(
                "AlloVariableFriendly", "AlloVariableSharp"
            )
    font.flavor = "woff2"
    font.save(dst)
    print(f"{total} corners sharpened (strength {strength}) -> {dst}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    sharpen(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 0.85)
