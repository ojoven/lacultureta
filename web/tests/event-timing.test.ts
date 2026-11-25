import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventTiming,relativeEventDate,displayHours } from '../src/lib/event-timing';
import { madridToday,validCalendarDate,dateWindow } from '../src/lib/dates';

test('relative dates preserve the full date and display time in both languages',()=>{
  assert.equal(eventTiming('2026-11-26','2026-11-26','19:00','es','2026-11-25'),'Mañana 26 nov - 19.00');
  assert.equal(eventTiming('2026-11-26','2026-11-26','19:00','eu','2026-11-25'),'Bihar 26 aza - 19.00');
  assert.equal(eventTiming('2026-11-25','2026-11-25','','es','2026-11-25'),'Hoy 25 nov');
  assert.equal(eventTiming('2026-11-25','2026-11-25','','eu','2026-11-25'),'Gaur 25 aza');
  assert.equal(eventTiming('2026-11-26','2026-11-26','19:00','es',null),'26 nov - 19.00');
});
test('weekday labels refer only to the current and following calendar weeks',()=>{
  assert.equal(relativeEventDate('2026-11-26','2026-11-26','es','2026-11-24'),'Este jueves');
  assert.equal(relativeEventDate('2026-11-26','2026-11-26','eu','2026-11-24'),'Ostegun honetan');
  assert.equal(relativeEventDate('2026-12-02','2026-12-02','es','2026-11-25'),'El próximo miércoles');
  assert.equal(relativeEventDate('2026-12-02','2026-12-02','eu','2026-11-25'),'Datorren asteazkenean');
  assert.equal(relativeEventDate('2026-12-01','2026-12-01','es','2026-11-29'),'El próximo martes');
  assert.equal(relativeEventDate('2026-12-09','2026-12-09','es','2026-11-25'),'');
  assert.equal(relativeEventDate('2026-11-24','2026-11-24','es','2026-11-25'),'');
});
test('ongoing events keep their absolute range and are labelled as ongoing',()=>{
  assert.equal(eventTiming('2026-11-20','2026-11-30','','es','2026-11-25'),'En curso 20 nov — 30 nov');
  assert.equal(relativeEventDate('2026-11-20','2026-11-25','eu','2026-11-25'),'Abian');
});
test('relative days use Madrid dates and survive both daylight-saving boundaries',()=>{
  assert.equal(madridToday(new Date('2026-11-25T23:30:00Z')),'2026-11-26');
  assert.equal(madridToday(new Date('2026-07-25T22:30:00Z')),'2026-07-26');
  for(const [today,tomorrow] of [['2026-03-28','2026-03-29'],['2026-10-24','2026-10-25']])assert.equal(relativeEventDate(tomorrow,tomorrow,'es',today),'Mañana');
});
test('date validation rejects nonexistent days and custom date windows preserve both bounds',()=>{
  assert.equal(validCalendarDate('2026-02-30'),false);assert.equal(validCalendarDate('2026-13-01'),false);assert.equal(validCalendarDate('2026-2-01'),false);
  assert.equal(validCalendarDate('2028-02-29'),true);
  assert.deepEqual(dateWindow('custom','2026-11-25',{from:'2026-11-28',to:'2026-12-01'}),['2026-11-28','2026-12-01']);
  assert.equal(displayHours('De 10:30 a 12:00 / 19:45'),'De 10.30 a 12.00 / 19.45');
});
