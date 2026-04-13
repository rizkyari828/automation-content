ARG GO_ALPINE_IMAGE=golang:1.25-alpine
ARG ALPINE_IMAGE=alpine:3.20
FROM ${GO_ALPINE_IMAGE} AS builder

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
COPY cmd ./cmd
COPY internal ./internal

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/publishing-api ./cmd/api \
  && CGO_ENABLED=0 GOOS=linux go build -o /out/publishing-worker ./cmd/worker

FROM ${ALPINE_IMAGE}

COPY --from=builder /out/publishing-api /usr/local/bin/publishing-api
COPY --from=builder /out/publishing-worker /usr/local/bin/publishing-worker

CMD ["publishing-api"]
