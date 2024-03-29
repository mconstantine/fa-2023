create table if not exists budget
(
    id uuid not null default gen_random_uuid(),
    year integer not null,
    value integer not null,
    category_id uuid,
    user_id uuid not null,
    constraint budget_pkey primary key (id),
    constraint category_id_year_unique unique nulls not distinct (category_id, year),
    constraint budget_user_id_fkey foreign key (user_id)
        references "user" (id) match simple
        on update no action
        on delete cascade
        not valid,
    constraint category_fkey foreign key (category_id)
        references category (id) match simple
        on update no action
        on delete cascade
        not valid
);
