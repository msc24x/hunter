-- This is an empty migration.
update competitions set scheduled_at=current_date();
update competitions set updated_at=current_date();
