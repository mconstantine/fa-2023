declare created_id uuid;

begin

insert into "user" (name, email, password)
select name, email, crypt(password, gen_salt('bf'))
from jsonb_populate_record(null::"user", body)
returning id into created_id;

return (
  select to_jsonb(u.*)
  from "user" u
  where u.id = created_id
);

end
