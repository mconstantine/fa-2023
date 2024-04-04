# Financial Analysis (2023)

This software should allow me to analize my expenses and figure out how much money I'm gaining, losing, wasting, investing or messing around with in general.

## How to make it work

### Installation

#### General

This project is designed to work with Docker, without dirtying the local development environment with any dependency, except for VSCode and Docker (not even Node!). This can be done by installing [VSCode](https://code.visualstudio.com/) and a couple of extensions, namely:

- [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
- [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

Once you do that, you can clone the repo, `cd` into it, and run:

- `docker volume create finance_db` to create a local volume for your data, so destroying the container won't make you loose it. Deleting the volume will though, in case you _want_ to loose your data
- `docker compose -f compose.dev.yaml up -d --build` to spin up all the things

Once it's done, you can click on your Docker tab in VSCode, find the `fa-2023` container, right click on it and select "Attach Visual Studio Code". Open the `app` directory.

Once inside the container, VSCode should prompt you to install all required extensions inside the container. These will keep the coding standards consistent for you.

#### Backend

The backend runs on Node and Postgres, with TypeORM and routing-controllers over Express. You'll need to run database migrations in order to bring it up to speed, can't do this with Docker as the database is in another container:

- `cd backend`
- `npm run migration:run`

To use it:

- `cd backend`
- `npm start` to run the server
- `npm test` to run tests once
- `yarn test --watch` to run the tests in watch mode (we use `yarn` as it allows to append stuff to commands)
- `npx tsc` to compile

> Don't build anything, you'd just waste precious memory. Docker will build for deploy when needed, from outside the container.

#### Frontend

The frontend runs on React and uses Storybook for components development and analysis. You don't need to set anything up as Docker installs stuff for you. To use it:

- `cd frontend`
- `npm run storybook` to start Storybook
- `npm start` to start Vite
- `npm test` to run tests once
- `yarn test --watch` to run the tests in watch mode (we use `yarn` as it allows to append stuff to commands)
- `npm run lint` to make ESLint make a sweep
- `npx tsc` to compile

> Don't build anything, you'd just waste precious memory. Docker will build for deploy when needed, from outside the container.

### Development

You can handle your code directly inside the container. Just remember to commit and push before you run `docker compose down`, or your changes will be wiped from existence together with the container. You can run `docker compose stop` with uncommitted changes though, that will just shut down the container.

Things you can do with Docker:

- `docker compose start` to start the containers (application and database). The containers will not start automatically when you restart your computer, as this thing was made to not be in your way
- `docker compose stop` to stop the containers, free the ports, but keep your changes in place
- `docker compose down` to wipe the containers from existence. This will also wipe your changes, so push them first or loose them forever
- `docker compose up -d` to spin up the container, or recreate them if they were already there
- `docker compose up -d --build` to spin up the container and rebuild the image. This is usually used if you changed the Dockerfile

For more interesting powers, refer to the Docker documentation.

### Known issues

#### Connection rejected by the database

In production, the server could not start because of an error like this:

```
error: pg_hba.conf rejects connection for host "IP_ADDRESS", user "postgres", database "finance", no encryption
```

The current solution is to go into the Postgres container, at `/var/lib/postgresql/data/pg_hba.conf`, and add this line at the end:

```
host all all IP_ADDRESS/24 trust
```

With `IP_ADDRESS` being the one shown in the error.

#### Manual database creation

In production, the `finance` database will not probably be there. The current solution is to go into the Postgres container, run `psql postgresql://USER:PASSWORD@localhost:5432` (use the ones you chose in the `compose.yml` file). The run `CREATE DATABASE finance;`, then `\q`.
