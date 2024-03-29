declare result "user";
begin
delete from "user" where id = target_id returning * into result;
return to_jsonb(result);
end
