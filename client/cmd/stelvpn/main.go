package main

import (
	"flag"
	"fmt"
	"os"
)

func usage() {
	fmt.Fprintln(os.Stderr, "usage: stelvpn <list|connect|disconnect|status|balance>")
	os.Exit(2)
}

func main() {
	flag.Usage = usage
	flag.Parse()
	if flag.NArg() < 1 {
		usage()
	}
	switch flag.Arg(0) {
	case "list":
		// TODO #36: list active nodes from registry contract
	case "connect":
		// TODO #37: open payment session + WireGuard handshake
	case "disconnect":
		// TODO #38: close session + collect refund
	case "status":
		// TODO #39: show current session and remaining balance
	case "balance":
		// TODO #40: query Horizon for XLM/USDC balance
	default:
		usage()
	}
}
