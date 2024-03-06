declare result transaction;
begin
delete from transaction
where id = target_id and user_id = owner_id
returning * into result;
return to_jsonb(result);
end
