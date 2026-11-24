import { EVENT_ID_PATTERN, type CultureEvent } from './types';

export const swipeHistoryKey='lacultureta.swiped.v1';
export interface SwipedPlan {id:string;endDate:string}
/** Keep decisions across visits, filters and rescheduling until explicitly undone. */
export function readSwipeHistory(raw:string|null):SwipedPlan[] {
  try {
    const input:unknown=JSON.parse(raw||'[]');
    if(!Array.isArray(input))return [];
    const records=new Map<string,SwipedPlan>();
    for(const item of input) {
      if(!item||typeof item!=='object')continue;
      const {id,endDate}=item;
      if(typeof id!=='string'||!EVENT_ID_PATTERN.test(id)||typeof endDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(endDate)||Number.isNaN(Date.parse(endDate))||new Date(endDate).toISOString().slice(0,10)!==endDate)continue;
      records.set(id,{id,endDate});
    }
    return [...records.values()];
  } catch {return [];}
}
export function rememberSwipe(history:SwipedPlan[],event:Pick<CultureEvent,'id'|'endDate'>):SwipedPlan[] {
  return [...history.filter(item=>item.id!==event.id),{id:event.id,endDate:event.endDate}];
}
