declare result category;

begin

insert into category (name, is_meta, is_projectable, keywords)
select name, is_meta, is_projectable, keywords
from jsonb_populate_record(null::category, body)
returning * into result;

return to_jsonb(result);

end
