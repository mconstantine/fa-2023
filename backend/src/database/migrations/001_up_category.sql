create table if not exists category
(
    id uuid not null default gen_random_uuid(),
    name character varying(255) not null,
    is_meta boolean not null,
    keywords character varying[] not null default '{}'::character varying[],
    constraint category_pkey primary key (id)
);
