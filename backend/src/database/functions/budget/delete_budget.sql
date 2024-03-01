declare result budget;
begin
delete from budget where id = target_id returning * into result;
return to_jsonb(result);
end
