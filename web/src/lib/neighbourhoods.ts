import type { Language } from './types';
const labels:Record<string,[string,string]>={
  ERDIALDEA:['Centro','Erdialdea'],GROS:['Gros','Gros'],EGIA:['Egia','Egia'],AIETE:['Aiete','Aiete'],
  ANTIGUA:['Antiguo','Antigua'],IBAETA:['Ibaeta','Ibaeta'],INTXAURRONDO:['Intxaurrondo','Intxaurrondo'],
  ALTZA:['Altza','Altza'],AMARABERRI:['Amara Berri','Amara Berri'],LOIOLA:['Loiola','Loiola'],MARTUTENE:['Martutene','Martutene'],
  'AÑORGA':['Añorga','Añorga'],'ATEGORRIETA - ULIA':['Ategorrieta-Ulia','Ategorrieta-Ulia'],
  'MIRAMON - ZORROAGA':['Miramon-Zorroaga','Miramon-Zorroaga'],
};
export function neighbourhoodLabel(name:string,language:Language){return labels[name]?.[language==='eu'?1:0]||name;}
