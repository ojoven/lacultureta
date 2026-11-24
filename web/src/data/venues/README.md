# Venue data

Source: Ayuntamiento de Donostia / San Sebastián, [Equipamientos culturales](https://www.donostia.eus/datosabiertos/catalogo/servicios-cultura).
Downloaded on 24 November 2026 from the catalogue's [GeoJSON resource](https://www.donostia.eus/datosabiertos/recursos/servicios-cultura/kulturekipamenduak.json).
Licence: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The snapshot and derived municipal venue data remain under this licence. Attribution: © Donostiako Udala – Ayuntamiento de Donostia / San Sebastián.

`donostia-culture.json` preserves the downloaded GeoJSON. The point geometry uses longitude/latitude. The separate X_etrs89 and Y_etrs89 properties use EPSG:25830 and must not be read as longitude/latitude. `Auzoa` is the city's neighbourhood label; preserve it rather than inventing a more specific district.

`venues.ts` derives a catalogue, registers explicit bilingual name aliases, and links imported events. Unresolved names are retained with null coordinates and neighbourhood. Generic city names, multiple venues, and ambiguous matches do not receive an invented location. Event-feed municipality coordinates must not be used as venue locations.

The snapshot is bundled with the importer, so event imports need no extra geocoding calls. To refresh, download the GeoJSON again from the source above, review the diff, then release it. Venue links and newly encountered names update on every event import. Existing event rows are backfilled once when this database migration is first opened. Existing saved and swiped event IDs remain unchanged.

`verified-addresses.json` records additional addresses from venue websites, with a source URL and check date for each fact. Dabadaba's neighbourhood is confirmed by its own venue page. Altxerri's neighbourhood remains unknown. The city's address download returned HTTP 429 during this enrichment, so no retry or alternate transport was used. An embedded Google Maps viewport centre is not proof of an exact venue point.
