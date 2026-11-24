export const CARD_EXIT_MS=260;
export function cardPose(depth:number,drag:number,leaving:boolean) {
  const progress=leaving?1:Math.min(Math.abs(drag)/220,1);
  return {offset:Math.max(0,depth-progress)*11,scale:1-Math.max(0,depth-progress)*.04};
}
