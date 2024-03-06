create table if not exists category
(
    id uuid not null default gen_random_uuid(),
    name character varying(255) not null,
    is_meta boolean not null,
    is_projectable boolean not null default false,
    keywords character varying[] not null default '{}'::character varying[],
    user_id uuid not null,
    constraint category_pkey primary key (id),
    constraint category_user_id_fkey foreign key (user_id)
        references "user" (id) match simple
        on update no action
        on delete cascade
        not valid
);
