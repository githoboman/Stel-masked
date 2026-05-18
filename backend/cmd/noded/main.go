package main

import (
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	cfg := flag.String("config", "noded.toml", "path to config file")
	flag.Parse()

	log.Printf("stellarvpn node daemon starting (config=%s)", *cfg)

	// TODO #11: load config
	// TODO #12: connect to Stellar Horizon, verify node is registered
	// TODO #13: start WireGuard control plane
	// TODO #14: start heartbeat loop
	// TODO #15: start usage accounting + settle ticker
	// TODO #16: start gRPC/HTTP control API for client handshake

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	log.Println("shutting down")
}
