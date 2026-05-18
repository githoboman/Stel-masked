import { useState } from "react";

const GITHUB_URL = "https://github.com/REPLACE_ME/stellarvpn";
const DRIPS_URL = "https://www.drips.network/wave/stellar";
const DESIGN_URL = `${GITHUB_URL}/blob/main/docs/DESIGN.md`;

export function App() {
  return (
    <>
      <style>{baseStyles}</style>
      <div className="page">
        <Nav />
        <Hero />
        <Stats />
        <How />
        <Why />
        <Status />
        <Contribute />
        <Footer />
      </div>
    </>
  );
}

function Nav() {
  return (
    <nav className="nav">
      <a href="#top" className="brand">
        <span className="logo" aria-hidden>◆</span> StellarVPN
      </a>
      <div className="nav-links">
        <a href="#how">How it works</a>
        <a href="#status">Status</a>
        <a href="#contribute">Contribute</a>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="cta">
          GitHub
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header id="top" className="hero">
      <span className="badge">Building on Stellar · Drips Wave</span>
      <h1>
        A decentralized VPN <br /> settled on <span className="grad">Stellar</span>.
      </h1>
      <p className="lede">
        Run a node. Stake XLM. Earn USDC for bandwidth.
        Users pay per megabyte with streaming micropayments that confirm in ~5 seconds at sub-cent fees.
      </p>
      <div className="hero-cta">
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn btn-primary">
          View on GitHub →
        </a>
        <a href={DESIGN_URL} target="_blank" rel="noreferrer" className="btn btn-ghost">
          Read the design doc
        </a>
      </div>
    </header>
  );
}

function Stats() {
  const items = [
    { k: "~5 s", v: "Finality on Stellar" },
    { k: "<$0.001", v: "Per-tx fee" },
    { k: "USDC", v: "Native on Stellar" },
    { k: "65", v: "Open Wave issues" },
  ];
  return (
    <section className="stats">
      {items.map((s) => (
        <div key={s.k} className="stat">
          <div className="stat-k">{s.k}</div>
          <div className="stat-v">{s.v}</div>
        </div>
      ))}
    </section>
  );
}

function How() {
  const steps = [
    {
      n: "01",
      t: "Node operator registers",
      d: "Stake XLM via the registry contract. Run the noded daemon with a public WireGuard endpoint.",
    },
    {
      n: "02",
      t: "User opens a session",
      d: "Pick a node, deposit USDC into the payment contract. The node hands back a WireGuard config.",
    },
    {
      n: "03",
      t: "Pay per megabyte",
      d: "Client signs receipts every 30s. The node settles on-chain. Sub-cent fees make per-MB pricing real.",
    },
    {
      n: "04",
      t: "Disconnect, get refund",
      d: "Close the session. Unused balance returns to your wallet in one tx.",
    },
  ];
  return (
    <section id="how" className="how">
      <h2>How it works</h2>
      <div className="steps">
        {steps.map((s) => (
          <div key={s.n} className="step">
            <div className="step-n">{s.n}</div>
            <div className="step-t">{s.t}</div>
            <div className="step-d">{s.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Why() {
  const rows = [
    ["Finality", "~5 seconds", "~12 seconds (Eth)", "~5 seconds (Stacks)"],
    ["Tx fee", "~$0.000001", "$0.50–$5.00", "~$0.001"],
    ["Stable payments", "Native USDC", "Bridged USDC", "STX / sBTC"],
    ["Smart contract lang", "Rust (Soroban)", "Solidity", "Clarity"],
    ["Per-MB pricing viable", "Yes", "No", "Marginal"],
  ];
  return (
    <section className="why">
      <h2>Why Stellar</h2>
      <p className="why-lede">
        A VPN settles hundreds of small payments per hour. Most chains can't price that economically.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th className="hl">Stellar</th>
              <th>Ethereum</th>
              <th>Stacks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]}>
                <td className="row-h">{r[0]}</td>
                <td className="hl">{r[1]}</td>
                <td>{r[2]}</td>
                <td>{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Status() {
  const rows: [string, "done" | "wip" | "todo", string][] = [
    ["Soroban registry contract", "done", "Live on testnet · 6 unit tests"],
    ["Soroban payment contract", "done", "Live on testnet · 7 unit tests"],
    ["Testnet deployment", "done", "Both contracts deployed + initialized"],
    ["Node daemon (Go)", "wip", "Skeleton + 15 scoped issues"],
    ["Client CLI (Go)", "wip", "Skeleton + 8 scoped issues"],
    ["Frontend wallet UX", "todo", "8 Wave issues filed"],
    ["Reputation contract", "todo", "Designed, issue #9"],
    ["Mainnet deployment", "todo", "After audit"],
  ];
  const label = { done: "Shipped", wip: "In progress", todo: "Planned" } as const;
  return (
    <section id="status" className="status">
      <h2>Project status</h2>
      <ul className="status-list">
        {rows.map(([t, s, n]) => (
          <li key={t} className={`status-row ${s}`}>
            <span className={`dot ${s}`} />
            <span className="status-t">{t}</span>
            <span className="status-tag">{label[s]}</span>
            <span className="status-n">{n}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Contribute() {
  const [copied, setCopied] = useState(false);
  const cmd = "git clone " + GITHUB_URL.replace("https://github.com/", "git@github.com:") + ".git";

  return (
    <section id="contribute" className="contribute">
      <h2>Contribute through Stellar Drips Wave</h2>
      <p>
        StellarVPN is a participating repo in the{" "}
        <a href={DRIPS_URL} target="_blank" rel="noreferrer">Stellar Drips Wave</a>.
        Solve a labeled issue during the 7-day monthly Wave window — merged PRs earn Points that translate to cash rewards.
      </p>
      <div className="cmd">
        <code>{cmd}</code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(cmd);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="contribute-cta">
        <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noreferrer" className="btn btn-primary">
          Browse open issues
        </a>
        <a href={DRIPS_URL} target="_blank" rel="noreferrer" className="btn btn-ghost">
          Learn about Drips Wave
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div>StellarVPN · Apache-2.0</div>
      <div>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
        {" · "}
        <a href={DESIGN_URL} target="_blank" rel="noreferrer">Design</a>
        {" · "}
        <a href={DRIPS_URL} target="_blank" rel="noreferrer">Drips Wave</a>
      </div>
    </footer>
  );
}

const baseStyles = `
  :root {
    --bg: #0a0612;
    --bg-2: #110a1f;
    --fg: #f4ecff;
    --muted: #9b8fb5;
    --accent: #7d00ff;
    --accent-2: #c084fc;
    --border: #2a1f3d;
    --card: #15102a;
    --green: #4ade80;
    --amber: #fbbf24;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { background: var(--bg); color: var(--fg); }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  a { color: inherit; text-decoration: none; }
  .page { max-width: 1080px; margin: 0 auto; padding: 0 24px; }

  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 24px 0; border-bottom: 1px solid var(--border);
    position: sticky; top: 0; background: rgba(10,6,18,0.85); backdrop-filter: blur(8px); z-index: 10;
  }
  .brand { font-weight: 700; font-size: 18px; display: inline-flex; align-items: center; gap: 8px; }
  .logo { color: var(--accent-2); }
  .nav-links { display: flex; align-items: center; gap: 28px; font-size: 14px; color: var(--muted); }
  .nav-links a:hover { color: var(--fg); }
  .nav-links .cta {
    color: var(--fg); border: 1px solid var(--border); padding: 8px 14px; border-radius: 8px;
  }
  .nav-links .cta:hover { border-color: var(--accent); }

  .hero { padding: 88px 0 64px; text-align: center; }
  .badge {
    display: inline-block; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--accent-2); border: 1px solid var(--border); padding: 6px 12px; border-radius: 999px;
    background: rgba(125,0,255,0.08);
  }
  .hero h1 {
    font-size: clamp(36px, 6vw, 64px); line-height: 1.05; font-weight: 800; letter-spacing: -0.02em;
    margin: 28px 0 24px;
  }
  .grad {
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .lede { color: var(--muted); font-size: 18px; max-width: 640px; margin: 0 auto 36px; }
  .hero-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  .btn {
    display: inline-flex; align-items: center; padding: 12px 22px; border-radius: 10px;
    font-weight: 600; font-size: 15px; transition: transform 0.1s ease, background 0.15s ease;
  }
  .btn:hover { transform: translateY(-1px); }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: #6b00d9; }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--fg); }
  .btn-ghost:hover { border-color: var(--accent); }

  .stats {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
    margin: 32px 0 96px; padding: 28px; background: var(--card); border-radius: 14px;
    border: 1px solid var(--border);
  }
  .stat { text-align: center; }
  .stat-k {
    font-size: 28px; font-weight: 700; letter-spacing: -0.02em;
    background: linear-gradient(135deg, var(--accent-2), var(--accent));
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .stat-v { color: var(--muted); font-size: 13px; margin-top: 4px; }
  @media (max-width: 640px) { .stats { grid-template-columns: repeat(2, 1fr); } }

  section { padding: 64px 0; border-top: 1px solid var(--border); }
  h2 { font-size: 32px; letter-spacing: -0.01em; margin-bottom: 32px; font-weight: 700; }

  .steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  .step {
    padding: 24px; background: var(--card); border: 1px solid var(--border); border-radius: 12px;
  }
  .step-n { font-family: ui-monospace, monospace; color: var(--accent-2); font-size: 13px; margin-bottom: 12px; }
  .step-t { font-weight: 600; margin-bottom: 8px; }
  .step-d { color: var(--muted); font-size: 14px; }
  @media (max-width: 880px) { .steps { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px) { .steps { grid-template-columns: 1fr; } }

  .why-lede { color: var(--muted); margin-bottom: 24px; max-width: 640px; }
  .table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { padding: 14px 16px; text-align: left; }
  thead tr { background: var(--bg-2); }
  th { font-weight: 600; color: var(--muted); }
  th.hl, td.hl { color: var(--accent-2); font-weight: 600; }
  tbody tr { border-top: 1px solid var(--border); }
  td.row-h { color: var(--muted); font-weight: 500; }

  .status-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .status-row {
    display: grid; grid-template-columns: 16px 1fr auto 2fr; gap: 16px; align-items: center;
    padding: 14px 18px; background: var(--card); border: 1px solid var(--border); border-radius: 10px;
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .dot.done { background: var(--green); box-shadow: 0 0 12px rgba(74,222,128,0.5); }
  .dot.wip { background: var(--amber); box-shadow: 0 0 12px rgba(251,191,36,0.4); }
  .dot.todo { background: #555; }
  .status-t { font-weight: 500; }
  .status-tag {
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
    padding: 3px 10px; border-radius: 999px; border: 1px solid var(--border); color: var(--muted);
  }
  .status-row.done .status-tag { color: var(--green); border-color: rgba(74,222,128,0.3); }
  .status-row.wip .status-tag { color: var(--amber); border-color: rgba(251,191,36,0.3); }
  .status-n { color: var(--muted); font-size: 14px; text-align: right; }
  @media (max-width: 720px) {
    .status-row { grid-template-columns: 16px 1fr; }
    .status-tag, .status-n { display: none; }
  }

  .contribute p { color: var(--muted); max-width: 720px; margin-bottom: 24px; }
  .contribute a { color: var(--accent-2); }
  .cmd {
    display: flex; gap: 8px; align-items: center; padding: 14px 18px;
    background: var(--bg-2); border: 1px solid var(--border); border-radius: 10px;
    font-family: ui-monospace, monospace; font-size: 13px; margin-bottom: 24px; overflow-x: auto;
  }
  .cmd code { color: var(--fg); flex: 1; white-space: nowrap; }
  .cmd button {
    background: var(--accent); color: white; border: 0; padding: 6px 14px; border-radius: 6px;
    font-size: 12px; font-weight: 600; cursor: pointer;
  }
  .contribute-cta { display: flex; gap: 12px; flex-wrap: wrap; }

  .footer {
    border-top: 1px solid var(--border); padding: 32px 0; margin-top: 32px;
    display: flex; justify-content: space-between; color: var(--muted); font-size: 13px;
    flex-wrap: wrap; gap: 12px;
  }
  .footer a:hover { color: var(--fg); }
`;
