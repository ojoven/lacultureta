/** Both languages use the same deterministic predicate as notification matching. */
export const familyAudienceSql="EXISTS(SELECT 1 FROM event_translations family WHERE family.event_id=e.id AND family_audience(family.title,family.description)=1)";
