declare result category;
begin
delete from category where id = target_id returning * into result;
return to_jsonb(result);
end
