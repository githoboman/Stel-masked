package session

import "time"

// Session tracks one client's connection on this node.
type Session struct {
	ClientAddr   string // Stellar address
	NodeAddr     string
	PeerPubKey   string
	StartedAt    time.Time
	BytesIn      uint64
	BytesOut     uint64
	LastSettleAt time.Time
}

// Store is the in-memory + persistent record of active sessions on this node.
type Store interface {
	Open(s *Session) error
	Get(clientAddr string) (*Session, bool)
	UpdateUsage(clientAddr string, in, out uint64) error
	Close(clientAddr string) error
	All() []*Session
}

// TODO #31: implement in-memory Store
// TODO #32: implement BoltDB-backed persistent Store (survives daemon restarts)
