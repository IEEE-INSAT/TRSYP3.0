-- Both pitching slots are technical challenge pitching, labelled for the
-- pitchers. Room (Party Room) and capacity (10) are unchanged.
UPDATE "workshops"
SET "title" = 'Technical Challenge Pitching · Session 1', "audience" = 'For pitchers'
WHERE "id" = 'challenge-pitching-1';

UPDATE "workshops"
SET "audience" = 'For pitchers'
WHERE "id" = 'technical-pitching-2';
