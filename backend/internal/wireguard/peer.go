package wireguard

// Peer represents a connected client peer on the WireGuard interface.
type Peer struct {
	PublicKey  string
	AllowedIPs []string
	Endpoint   string
}

// Manager controls the local wg interface — add/remove peers, query usage.
type Manager interface {
	AddPeer(p Peer) error
	RemovePeer(publicKey string) error
	ListPeers() ([]Peer, error)
	UsageBytes(publicKey string) (rx, tx uint64, err error)
}

// TODO #21: implement Manager backed by wgctrl-go
// TODO #22: implement Manager backed by `wg` CLI for non-root environments
