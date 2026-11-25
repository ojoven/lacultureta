import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isFamilyAudience } from '../src/lib/audience';

test('family audience requires direct child or family audience evidence in Spanish or Basque',()=>{
  for(const [title,description] of [
    ['Taller infantil',''],['Concierto Infantil',''],['Taller de danza en familia',''],
    ['Un espectáculo','Dirigido al público infantil.'],['Una película','Una sesión para toda la familia.'],
    ['Murren bidaia','Murren bidaia haur antzezlana taularatuko du.'],['Magiklown','Haurrentzako ikuskizuna.'],
    ['Tailerra','Familientzako tailerra.'],['104. Haurra','Adina: + 5 urte'],['Mamuka','Edad: +3 años.'],
    ['Gezur gehiegi','Adina: Haur Hezkuntza 5 - Lehen Hezkuntza 5.'],['Taller','De 3 a 8 años.'],['Tailerra','4–8 urte.'],
  ])assert.equal(isFamilyAudience(title,description),true,title+': '+description);
});
test('stories about families and incidental mentions do not imply a child audience',()=>{
  for(const [title,description] of [
    ['El amor que permanece','Gurasoak banatzen ari diren familia baten bizitzan urtebete.'],
    ['Cisjordania','Euskadin bizi den familia errefuxiatu batek prestatutako gastronomia.'],
    ['Exacticamente diversa','Eskerrak logistikan parte hartzen duten familia guztiei.'],
    ['53 domingos','Una comedia familiar sobre tres hermanos y su padre de 86 años.'],
    ['Krilin','Una fiesta en familia para recordar los quince años de la banda.'],
    ['Recital','Ha trabajado en teatro infantil. Ahora presenta un recital para adultos.'],
    ['Exposición','Una exposición de arte. Actividades paralelas: talleres para toda la familia.'],
    ['Muestra de dibujos de un concurso infantil','Dibujos premiados.'],
    ['Ciclo Frédéric Chopin','Conciertos del ciclo. Uno es un concierto infantil.'],
    ['Programa de Navidad','Taller infantil y propuestas para toda la familia.'],
    ['Teatro infantil','Solo para adultos.'],['Taller familiar','A partir de 16 años.'],
    ['Drama','Not suitable for children.'],
    ['Recital','Edad: a partir de 8 años. Menores de 16 años deben acudir acompañados.'],
    ['Kontzertua','Adina: 8 urtetik aurrera. 16 urtetik beherakoak heldu batekin joan beharko dute.'],
    ['Frédéric Chopin Zikloa 2026','Haurrei zuzendutako kontzertu bat ere izango da.'],
  ])assert.equal(isFamilyAudience(title,description),false,title+': '+description);
});
