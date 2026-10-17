-- The live Ethical Decision Test's shared state: one row, moved on by the
-- moderators. Votes are not stored.
CREATE TABLE "ethics_session" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "step" INTEGER NOT NULL DEFAULT 0,
    "voting_open" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ethics_session_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ethics_session_single_row" CHECK ("id" = 1),
    CONSTRAINT "ethics_session_step_check" CHECK ("step" >= 0)
);

INSERT INTO "ethics_session" ("id", "updated_at") VALUES (1, CURRENT_TIMESTAMP);
