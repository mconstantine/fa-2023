# Financial Analysis (2023)

This software should allow me to analize my expenses and figure out how much money I'm gaining, losing, wasting, investing or messing around with in general.

## How to make it work

### Installation

#### General

This project is designed to work with Docker, without dirtying the local development environment with any dependency, except for VSCode and Docker (not even Node!). This can be done by installing [VSCode](https://code.visualstudio.com/) and a couple of extensions, namely:

- [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
- [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

Once you do that, you can clone the repo, `cd` into it, and run:

- `docker compose up -d --build`

Once it's done, you can click on your Docker tab in VSCode, find the `fa-2023` container, right click on it and select "Attach Visual Studio Code".

Once inside the container, VSCode should prompt you to install all required extensions inside the container. These will keep the coding standards consistent for you.

#### Backend

The backend runs on Node and Postgres, with TypeORM and routing-controllers over Express. You don't need any setup as Docker installs dependencies and runs database migrations for you (TODO: test this claim). To use it:

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
