create table if not exists transaction
(
    id uuid not null default gen_random_uuid(),
    description character varying(255) not null,
    value integer not null,
    date date not null,
    constraint transaction_pkey primary key (id)
);

create table if not exists transactions_categories
(
    transaction_id uuid not null,
    category_id uuid not null,
    constraint transactions_categories_pkey primary key (transaction_id, category_id),
    constraint transaction_category_unique unique (transaction_id, category_id),
    constraint transaction_fkey foreign key (transaction_id)
        references transaction (id) match simple
        on update no action
        on delete cascade
        not valid,
    constraint category_fkey foreign key (category_id)
        references category (id) match simple
        on update no action
        on delete cascade
        not valid
);
