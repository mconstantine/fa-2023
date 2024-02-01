declare result category;

begin

insert into category (name, is_meta, keywords)
select name, is_meta, keywords
from jsonb_populate_record(null::category, body)
returning * into result;

return to_jsonb(result);

end
