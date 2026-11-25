/** Conservative audience evidence. A family mentioned in a story is not an audience label. */
const normalise=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\u00a0/g,' ');
const adultOnly=/\b(?:solo para adultos|exclusivamente para adultos|publico adulto|adult(?:s)? only|not (?:suitable )?for children|helduentzako bakarrik)\b|\b(?:mayores de|a partir de|apartir de)\s*(?:1[3-9]|[2-9]\d)\s*anos\b|\b(?:1[3-9]|[2-9]\d)\s*urtetik gorako|\bno (?:es |esta )?(?:recomendad[ao]|apt[ao]|dirigid[ao])[^.!?\n]{0,45}\b(?:ninos|ninas|infantil)\b/;
const childTitle=/\b(?:taller(?:es)?|concierto(?:s)?|teatro|cine|espectaculo(?:s)?|actividad(?:es)?|sesion(?:es)?|danza|festival|magia|concurso|cuentacuentos)\s+(?:(?:de|para|y|musica|danza|teatro|cine)\s+){0,3}(?:infantil(?:es)?|familiar(?:es)?|en familia|para (?:ninos|ninas|familias))\b/;
const basqueAudience=/\b(?:haurrentz(?:ako|at)|haurrei|umeentz(?:ako|at)|txikientz(?:ako|at)|txikienentz(?:ako|at)|familientz(?:ako|at))\b|\bhaur (?:antzerki\w*|antzezlan\w*|ikuskizun\w*|emanaldi\w*|zinema\w*|tailer\w*|kontzertu\w*)\b/;
const explicitAudience=/\bpublico (?:infantil|familiar)\b|\b(?:dirigid[ao]s?|destinad[ao]s?|pensad[ao]s?|concebid[ao]s?|orientad[ao]s?|recomendad[ao]s?)\s+(?:especialmente\s+)?(?:a|al|para)\s+(?:(?:un|el|los|las)\s+)?(?:publico\s+)?(?:infantil|familiar|ninos|ninas|familias)\b|\b(?:disfrutar en familia|disfrute de toda la familia|para toda la familia|emocionara a toda la familia)\b|\b(?:taller|actividad|sesion|danza|juego|construccion)\b[^.!?\n]{0,55}\ben familia\b|\b(?:for children|family-friendly)\b/;
function childAge(text:string) {
  const range=/\b(?:de|entre)\s*(\d{1,2})\s*(?:a|y|-)\s*(\d{1,2})\s*anos\b|\b(\d{1,2})\s*[-–]\s*(\d{1,2})\s*urte\b/g;
  for(const match of text.matchAll(range)){
    const min=Number(match[1]??match[3]),max=Number(match[2]??match[4]);if(min<=12&&max>=min&&max<=14)return true;
  }
  const labelled=text.match(/\b(?:edad(?:es)?|adina|adinea)\s*[:\-]\s*(?:\+\s*)?(\d{1,2})\s*(?:anos|urte)\b/);
  if(labelled&&Number(labelled[1])<=12)return true;
  if(/\b(?:edad(?:es)?|adina)\s*[:\-]\s*(?:educacion infantil|haur hezkuntza)\b/.test(text))return true;
  const minimum=text.match(/\ba partir de\s*(\d{1,2})\s*anos\b|\b(\d{1,2})\s*urtetik (?:aurrera|gorako)/);
  // A general admission threshold of 8+ does not identify a child audience.
  return !!minimum&&Number(minimum[1]??minimum[2])<=6;
}
export function isFamilyAudience(title:string,description:string):boolean {
  const heading=normalise(title),body=normalise(description),text=heading+'\n'+body;
  if(adultOnly.test(text))return false;
  const titleEvidence=basqueAudience.test(heading)||(!/\b(?:exposicion|muestra|erakusketa)\b/.test(heading)&&childTitle.test(heading));
  if(titleEvidence)return true;
  // A whole programme containing one children's event should not inherit that audience.
  if(/\b(?:programa|programacion|ciclo|zikloa|egitaraua)\b/.test(heading)||/\begitarauak\b/.test(body.slice(0,500)))return false;
  const lead=body.split(/\b(?:actividades paralelas|consulta (?:aqui )?(?:toda )?la programacion|biografia|ficha artistica|ibilbidea)\b/)[0].slice(0,1800);
  const sentences=lead.split(/(?<=[.!?])\s+|\n+/).filter(sentence=>!/(?:ha trabajado|trabajo en|ha participado|participo en|ha actuado|desde pequeno|desde pequena|en su infancia|haurtzaro|bere ibilbide)/.test(sentence));
  return sentences.some(sentence=>basqueAudience.test(sentence)||explicitAudience.test(sentence)||childAge(sentence))||
    body.split('\n').some(line=>/^\s*(?:edad(?:es)?|adina|adinea)\s*[:\-]/.test(line)&&childAge(line));
}
