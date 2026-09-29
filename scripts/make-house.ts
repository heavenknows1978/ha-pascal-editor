// Builds the ground-floor scene (metres) with Pascal's own node schemas so every default is filled in.
// Run inside the add-on image:  bun run make-house.ts > graph.json
//
// Layout (x = along the length, z = across the width). Interior (clear) sizes, from the survey sketch:
//   width  3.80 m (clear)          length 13.79 m = 5.88 + 1.22 + 2.86 + 0.95 + 0.40 + 1.83 + 0.65
//   rear porch ("hiên sau") 2.00 m deep, outside the rear wall (x < 0), no walls
import { BuildingNode, LevelNode, SiteNode, SlabNode, WallNode, ZoneNode } from '@pascal-app/core/schema'

const CLEAR_W = 3.8
const CLEAR_L = 13.79
const T = 0.2 // wall thickness
const PORCH = 2.0
const LEVEL_H = 3.4

// wall centre-lines sit half a thickness outside the clear rectangle
const x0 = -T / 2
const x1 = CLEAR_L + T / 2
const z0 = -T / 2
const z1 = CLEAR_W + T / 2

const wall = (id: string, start: [number, number], end: [number, number]) =>
  WallNode.parse({ id, parentId: 'level_0', start, end, thickness: T, children: [] })

const walls = [
  wall('wall_rear_top', [x0, z0], [x1, z0]),
  wall('wall_right', [x1, z0], [x1, z1]),
  wall('wall_rear_bottom', [x1, z1], [x0, z1]),
  wall('wall_left', [x0, z1], [x0, z0]),
]

const interior: [number, number][] = [[0, 0], [CLEAR_L, 0], [CLEAR_L, CLEAR_W], [0, CLEAR_W]]
const porch: [number, number][] = [
  [-T - PORCH, -T], [-T, -T], [-T, CLEAR_W + T], [-T - PORCH, CLEAR_W + T],
]

const slabInterior = SlabNode.parse({ id: 'slab_floor', parentId: 'level_0', polygon: interior })
const slabPorch = SlabNode.parse({ id: 'slab_porch', parentId: 'level_0', polygon: porch })
const zoneInterior = ZoneNode.parse({ id: 'zone_ground', parentId: 'level_0', name: 'Tầng trệt', color: '#60a5fa', polygon: interior })
const zonePorch = ZoneNode.parse({ id: 'zone_porch', parentId: 'level_0', name: 'Hiên sau', color: '#f59e0b', polygon: porch })

const childIds = [...walls.map((w) => w.id), slabInterior.id, slabPorch.id, zoneInterior.id, zonePorch.id]

const level = LevelNode.parse({ id: 'level_0', parentId: 'building_house', level: 0, height: LEVEL_H, children: childIds })
const building = BuildingNode.parse({ id: 'building_house', parentId: 'site_house', position: [0, 0, 0], rotation: [0, 0, 0], children: ['level_0'] })
const site = SiteNode.parse({
  id: 'site_house',
  parentId: null,
  polygon: { type: 'polygon', points: [[-12, -10], [30, -10], [30, 14], [-12, 14]] },
  children: ['building_house'],
})

const nodes: Record<string, unknown> = {}
for (const n of [site, building, level, ...walls, slabInterior, slabPorch, zoneInterior, zonePorch]) {
  nodes[(n as { id: string }).id] = n
}
console.log(JSON.stringify({ nodes, rootNodeIds: ['site_house'] }))
