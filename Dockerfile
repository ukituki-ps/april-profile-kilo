FROM golang:1.24-bookworm AS builder

WORKDIR /src

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/april-profile ./cmd/april-profile

FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app

COPY --from=builder /out/april-profile /usr/local/bin/april-profile

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/april-profile"]
