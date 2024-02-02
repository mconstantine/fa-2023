declare result transaction;

begin

insert into transaction (description, value, date)
select description, value, date
from jsonb_populate_record(null::transaction, body)
returning * into result;

return to_jsonb(result);

end
