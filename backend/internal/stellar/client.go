package stellar

// Client wraps Horizon + Soroban RPC for the node daemon and CLI client.
type Client struct {
	HorizonURL string
	SorobanURL string
	NetworkID  string
}

// TODO #25: implement IsNodeRegistered(operator) -> (bool, error) via Soroban RPC
// TODO #26: implement SubmitSettleReceipt(receipt) -> tx hash
// TODO #27: implement WatchPaymentEvents(callback) for live settlement notifications
