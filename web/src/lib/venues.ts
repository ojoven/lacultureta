import { createHash } from 'node:crypto';
import type Database from 'better-sqlite3';
import snapshot from '../data/venues/donostia-culture.json';
import verifiedAddresses from '../data/venues/verified-addresses.json';
import type { ImportedEvent, Language } from './types';
type VenueEvent=Pick<ImportedEvent,'id'|'source'>&{translations:Record<Language,{place:string}>};

const sourceUrl='https://www.donostia.eus/datosabiertos/catalogo/servicios-cultura';
const licence='CC-BY-SA-3.0';
export const venueKey=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const venueId=(name:string)=>'city-'+createHash('sha256').update(venueKey(name)).digest('hex').slice(0,20);
const aliases:Record<string,string[]>={
  'KURSAAL':['Kursaal - Sala Kubo','Kutxa Fundazioa Kubo'],
  'TABAKALERA':['Kutxa Fundazioa Kluba','Kutxa Fundazioa Artegunea','Kutxa Fundazioa en Tabakalera - Planta 1 - Kluba','Elías Querejeta Zine Eskola'],
  'SAN TELMO MUSEOA':['Museo San Telmo','San Telmo Museoa'],
  'VICTORIA EUGENIA ANTZOKIA':['Teatro Victoria Eugenia','Victoria Eugenia Antzokia','Victoria Eugenia Club'],
  'ANTZOKI ZAHARRA':['Teatro Principal','Teatro Principal de Donostia (Antzoki Zaharra)','Antzoki Zaharra'],
  'AQUARIUM':['Aquarium-Palacio del Mar de Donostia-San Sebastián'],
  'AIETE KULTUR ETXEA':['Centro Cultural Aiete','Aiete Kultur Etxea','Aiete K.E.'],
  'OKENDO KULTUR ETXEA':['Centro Cultural Okendo','Okendo Kultur Etxea','Okendo K.E.'],
  'GAZTESZENA-EGIA KULTUR ETXEA':['Gazteszena','Gazteszena (Egia)'],
  'EGIA KULTUR ETXEA':['Centro Cultural Egia','Egia Kultur Etxea','Egia K.E.'],
  'INTXAURRONDO':['Centro Cultural Intxaurrondo','Intxaurrondo Kultur Etxea','Intxaurrondo K.E.'],
  'AMARA-ERNEST LLUCH KULTUR ETXEA':['Centro Cultural Ernest Lluch','Ernest Lluch Kultur Etxea','Ernest Lluch K.E.'],
  'LUGARITZ KULTUR ETXEA':['Centro Cultural Lugaritz','Sala Imanol Larzabal (Lugaritz)','Imanol Larzabal Aretoa (Lugaritz)','Lugaritz Kultur Etxea','Lugaritz K.E.'],
  'ALTZA-LARRATXO KULTUR ETXEA':['Centro Cultural Larratxo','Larratxo Kultur Etxea','Larratxo K.E.'],
  'LARROTXENE':['Centro Cultural Larrotxene','Larrotxene Kultur Etxea','Larrotxene K.E.'],
  'ALTZA- CASARES KULTUR ETXEA':['Centro Cultural Casares','Casares Kultur Etxea','Casares K.E.'],
  'ALTZA- TOMASENE KULTUR ETXEA':['Centro Cultural Tomasene','Tomasene Kultur Etxea','Tomasene K.E.'],
  'LOIOLA KULTUR ETXEA':['Centro Cultural Loiola','Loiola Kultur Etxea','Loiola K.E.'],
  'ETXARRIENE KULTUR ETXEA':['Etxarri Ene Kultur Etxea','Etxarriene Kultur Etxea','Etxarriene'],
  'ANTIGUO BERRI ZINEAK':['Cines Antiguo Berri'],
  'PRÍNCIPE ZINEAK':['Cines Príncipe'],
  'EUSKAL ITSAS MUSEOA':['Museo Marítimo Vasco'],
  'CEMENTO REZOLA MUSEOA':['Museum Cemento Rezola'],
  'INGURUMEN BALIABIDEEN ETXEA-CRISTINA ENEA':['Centro de Documentación de Cristina Enea','Centro de Recursos Medio Ambientales de Cristina Enea (Donostia)'],
  'UDAL LIBURUTEGI NAGUSIKO HAUR SAILA':['Biblioteca Central Infantil','Haur Liburutegi Nagusia'],
  'UDAL LIBURUTEGI NAGUSIA':['Biblioteca Municipal Central de San Sebastián'],
};
const tabakaleraRooms=new Set(['Sala 1','Sala 2','Zinea','Zinema','Cine','Medialab','Sala de Exposiciones','Erakusketa Aretoa','Sala de exposiciones 2','Erakusketa aretoa 2','Patioa','Espacio de artistas','Artisten Gunea','Laboratorio de cine y audiovisual','Zine eta ikus-entzunezko laborategia','3ª Planta','3. solairua'].map(venueKey));
export const venueCatalogueVersion='venue-registry-v1-'+createHash('sha256').update(JSON.stringify([snapshot,verifiedAddresses,aliases,[...tabakaleraRooms]])).digest('hex').slice(0,16);
export function syncVenueCatalogue(database:Database.Database) {
  const put=database.prepare(`INSERT INTO venues(id,name_es,name_eu,address_es,address_eu,latitude,longitude,neighbourhood,source_url,source_license,status,updated_at)
    VALUES (@id,@nameEs,@nameEu,@addressEs,@addressEu,@latitude,@longitude,@neighbourhood,@sourceUrl,@licence,'located',@now)
    ON CONFLICT(id) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,neighbourhood=excluded.neighbourhood,
      address_es=excluded.address_es,address_eu=excluded.address_eu,updated_at=excluded.updated_at WHERE venues.status<>'manual'`);
  const alias=database.prepare(`INSERT INTO venue_aliases(alias,venue_id) VALUES (?,?) ON CONFLICT(alias) DO UPDATE SET venue_id=excluded.venue_id WHERE EXISTS(SELECT 1 FROM venues WHERE id=venue_aliases.venue_id AND status='unresolved')`);
  const seen=new Set<string>(),now=new Date().toISOString();
  for(const feature of snapshot.features) {
    const p=feature.properties,[longitude,latitude]=feature.geometry.coordinates;
    if(feature.geometry.type!=='Point'||!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<43||latitude>43.5||longitude< -2.5||longitude> -1.5)throw new Error('Invalid municipal venue point');
    const id=venueId(p.NomEdifici);
    if(seen.has(id))continue;
    seen.add(id);
    put.run({id,nameEs:p.NomEdifici,nameEu:p.IzenEraiki,addressEs:`${p.NomCalle.trim()} ${p.Portal}`,addressEu:`${p.IzenKalea.trim()} ${p.Ataria}`,latitude,longitude,neighbourhood:p.Auzoa,sourceUrl,licence,now});
    for(const name of [p.NomEdifici,p.IzenEraiki,...(aliases[p.NomEdifici]||[])])alias.run(venueKey(name),id);
  }
  const address=database.prepare(`INSERT INTO venues(id,name_es,name_eu,address_es,address_eu,neighbourhood,source_url,status,updated_at)
    VALUES (@id,@name,@name,@address,@address,@neighbourhood,@sourceUrl,'address-only',@checkedAt)
    ON CONFLICT(id) DO UPDATE SET address_es=excluded.address_es,address_eu=excluded.address_eu,
      neighbourhood=excluded.neighbourhood,source_url=excluded.source_url,updated_at=excluded.updated_at WHERE venues.status='address-only'`);
  for(const item of verifiedAddresses) {
    const id='venue-'+item.id;
    address.run({...item,id});
    for(const name of item.aliases)alias.run(venueKey(name),id);
  }
}
export function linkEventVenues(database:Database.Database,events:VenueEvent[]) {
  const lookup=database.prepare('SELECT venue_id AS id FROM venue_aliases WHERE alias=?');
  const placeholder=database.prepare(`INSERT OR IGNORE INTO venues(id,name_es,name_eu,status,updated_at) VALUES (?,?,?,'unresolved',?)`);
  const alias=database.prepare('INSERT OR IGNORE INTO venue_aliases(alias,venue_id) VALUES (?,?)');
  const link=database.prepare('INSERT OR IGNORE INTO event_venues(event_id,venue_id) VALUES (?,?)');
  const unlink=database.prepare('DELETE FROM event_venues WHERE event_id=?');
  for(const event of events) {
    const names=[event.translations.es.place,event.translations.eu.place].filter(Boolean);
    const matches=names.map(name=>lookup.get(venueKey(name)) as {id:string}|undefined).filter((item):item is {id:string}=>!!item);
    let ids=[...new Set(matches.map(item=>item.id))];
    if(ids.length>1) {
      const located=database.prepare("SELECT id FROM venues WHERE id IN ("+ids.map(()=>'?').join(',')+") AND status<>'unresolved'").all(...ids) as {id:string}[];
      if(located.length===1)ids=[located[0].id];
    }
    // Tabakalera's room names are only aliases within that organiser, never globally.
    if((!ids.length||ids.every(id=>id.startsWith('unresolved-')))&&event.source==='tabakalera'&&names.some(name=>tabakaleraRooms.has(venueKey(name))))ids=[venueId('TABAKALERA')];
    if(!ids.length) {
      const name=names[0]||'Donostia',id='unresolved-'+createHash('sha256').update(venueKey(name)).digest('hex').slice(0,20);
      placeholder.run(id,name,names[1]||name,new Date().toISOString());
      for(const label of names)alias.run(venueKey(label),id);
      ids=[id];
    }
    unlink.run(event.id);
    // Conflicting bilingual venue names remain unresolved rather than assigning two guessed locations.
    if(ids.length===1)link.run(event.id,ids[0]);
  }
}
export function venueCoverage(database:Database.Database) {
  return database.prepare(`SELECT COUNT(*) AS venues,SUM(latitude IS NOT NULL) AS located,SUM(neighbourhood IS NOT NULL) AS neighbourhoods FROM venues`).get();
}
