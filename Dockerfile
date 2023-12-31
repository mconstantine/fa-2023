# syntax=docker/dockerfile:1

FROM node:21-bookworm
WORKDIR /app
COPY . .
RUN cd backend && npm ci
RUN cd frontend && npm ci
EXPOSE 5000
