FROM public.ecr.aws/docker/library/golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
COPY cmd ./cmd
COPY internal ./internal

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/media-api ./cmd/api \
  && CGO_ENABLED=0 GOOS=linux go build -o /out/media-worker ./cmd/worker

FROM public.ecr.aws/docker/library/alpine:3.20

COPY --from=builder /out/media-api /usr/local/bin/media-api
COPY --from=builder /out/media-worker /usr/local/bin/media-worker

CMD ["media-api"]
