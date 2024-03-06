declare result category;
begin

insert into category (name, is_meta, is_projectable, keywords, user_id)
select name, is_meta, is_projectable, keywords, user_id
from jsonb_populate_record(null::category, body || jsonb_build_object('user_id', owner_id))
returning * into result;

return to_jsonb(result);

end
