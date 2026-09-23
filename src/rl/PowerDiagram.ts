export interface Point2D {
  x: number;
  y: number;
}

export type Polygon2D = Point2D[];

/**
 * Clips a polygon against a half-plane defined by a boundary point B and normal N.
 * Normal N points towards the interior (the half-plane to keep).
 */
export function clipPolygonByHalfPlane(
  polygon: Polygon2D,
  B: Point2D,
  N: Point2D
): Polygon2D {
  if (polygon.length === 0) return [];

  const clipped: Polygon2D = [];
  const dot = (p: Point2D) => (p.x - B.x) * N.x + (p.y - B.y) * N.y;

  let s = polygon[polygon.length - 1];
  let sDot = dot(s);

  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i];
    const pDot = dot(p);

    if (pDot >= 0) {
      if (sDot < 0) {
        // s was outside, p is inside: compute intersection
        const t = sDot / (sDot - pDot);
        clipped.push({
          x: s.x + t * (p.x - s.x),
          y: s.y + t * (p.y - s.y),
        });
      }
      clipped.push(p);
    } else if (sDot >= 0) {
      // s was inside, p is outside: compute intersection
      const t = sDot / (sDot - pDot);
      clipped.push({
        x: s.x + t * (p.x - s.x),
        y: s.y + t * (p.y - s.y),
      });
    }

    s = p;
    sDot = pDot;
  }

  return clipped;
}

/**
 * Computes the power diagram cells for a set of sites.
 * Each site has a position and a weight.
 * The cell is bounded by the bounding box [minX, maxX, minY, maxY].
 */
export function computePowerDiagramCells(
  sites: { id: string; x: number; y: number; weight: number }[],
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): { id: string; polygon: Polygon2D }[] {
  const initialBox: Polygon2D = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.maxY },
  ];

  return sites.map((site) => {
    let cell = [...initialBox];

    for (const other of sites) {
      if (other.id === site.id) continue;

      // Compute midpoint/boundary point B on segment between site and other.
      // Vector from site (P_i) to other (P_j)
      const dx = other.x - site.x;
      const dy = other.y - site.y;
      const dSq = dx * dx + dy * dy;

      if (dSq < 0.0001) continue; // Skip coincident sites

      // B = P_i + t * (P_j - P_i)
      // t = 1/2 + (w_i - w_j) / (2 * |P_j - P_i|^2)
      const t = 0.5 + (site.weight - other.weight) / (2 * dSq);

      const B: Point2D = {
        x: site.x + t * dx,
        y: site.y + t * dy,
      };

      // Normal vector pointing towards site (inside the cell of interest)
      // N = P_i - P_j = - (P_j - P_i)
      const N: Point2D = {
        x: -dx,
        y: -dy,
      };

      cell = clipPolygonByHalfPlane(cell, B, N);
    }

    return { id: site.id, polygon: cell };
  });
}
