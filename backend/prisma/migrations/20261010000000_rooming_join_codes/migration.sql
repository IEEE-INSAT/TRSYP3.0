-- Rooming moves from owner invitations to team-style join codes: the owner
-- creates a room and shares its code, a roommate joins with it. Every room is
-- a double (enforced in the service), so `size` goes, and so do the
-- invitation and confirmation flows.
--
-- Both tables were empty when this was written; the NOT NULL columns below
-- have no default and would fail on existing rooms.
DROP TABLE IF EXISTS "invitations";
DROP TYPE IF EXISTS "InvitationStatus";

ALTER TABLE "rooms" DROP COLUMN IF EXISTS "size";
ALTER TABLE "rooms" DROP COLUMN IF EXISTS "status";
DROP TYPE IF EXISTS "RoomStatus";

ALTER TABLE "rooms" ADD COLUMN "code" TEXT NOT NULL;
ALTER TABLE "rooms" ADD COLUMN "gender" TEXT NOT NULL;

CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");
