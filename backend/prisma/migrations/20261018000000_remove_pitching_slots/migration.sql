-- Pitching is no longer booked on the website. Only the workshops are; each
-- selected technical challenge team must still have a member in one of them
-- (shown as a note and reported, not enforced). Neither slot had bookings
-- when this was written.
DELETE FROM "workshops" WHERE "id" IN ('challenge-pitching-1', 'technical-pitching-2');

DROP TABLE "workshop_teams";
