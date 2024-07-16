FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
FROM node:latest AS node
FROM debian:bookworm-slim AS base 

FROM node AS frontal-deps

WORKDIR /app/frontal

COPY frontal/package.json frontal/package-lock.json* ./

RUN npm ci 

FROM node AS frontal-builder
ENV NEXT_PUBLIC_APP_MODE=production
WORKDIR /app/frontal
COPY frontal .
COPY --from=frontal-deps /app/frontal/node_modules ./node_modules
RUN npx next build

FROM chef AS parietal-deps

WORKDIR /app/parietal

COPY ./parietal .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS parietal-builder

WORKDIR /app/parietal
COPY --from=parietal-deps /app/parietal/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

COPY ./parietal .
COPY --from=frontal-builder /app/frontal/out /app/frontal/out
RUN cargo build --release

FROM base AS final
WORKDIR /app

COPY --from=parietal-builder /app/parietal/target/release/parietal /app/parietal

ENTRYPOINT ["/app/parietal"]
