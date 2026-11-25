/** Public tile settings are read at request time; no build or API key is needed for OSM. */
export function mapTiles() {
  return {
    url:process.env.MAP_TILE_URL||'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:process.env.MAP_TILE_ATTRIBUTION||'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom:Math.min(19,Math.max(1,Number(process.env.MAP_TILE_MAX_ZOOM)||19)),
  };
}
