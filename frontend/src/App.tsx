import { useState } from "react";

export function App() {
  const [connected, setConnected] = useState(false);

  // TODO #44: wire Freighter connect button
  // TODO #45: fetch node list from registry contract
  // TODO #46: render session status + live balance
  // TODO #47: implement connect/disconnect handlers

  return (
    <main style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>StellarVPN</h1>
      <p>Status: {connected ? "connected" : "disconnected"}</p>
      <button onClick={() => setConnected((c) => !c)}>
        {connected ? "Disconnect" : "Connect"}
      </button>
    </main>
  );
}
