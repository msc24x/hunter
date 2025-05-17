-- This is an empty migration.

UPDATE `competitions` SET `hidden_scoreboard` = 'PUBLIC' WHERE `public` = TRUE;
