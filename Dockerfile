# syntax=docker/dockerfile:1

FROM node:21-bookworm as dev
WORKDIR /app
COPY . .
RUN cd backend && npm ci
RUN cd frontend && npm ci
EXPOSE 5000

FROM dev as build
RUN cd backend && npm run build
# RUN cd frontend && npm run build

FROM --platform=linux/amd64 node:21-alpine
WORKDIR /finance

COPY --from=build /app/backend/build server
COPY ./backend/.env .env
COPY ./backend/package.json package.json
COPY ./backend/package-lock.json package-lock.json
COPY --from=build /app/backend/src/database/*.sql server/database
COPY --from=build /app/backend/src/database/**/*.sql server/database

RUN npm ci --production
CMD /bin/sh -c "while sleep 1000; do :; done"
# CMD node --env-file=.env ./server
