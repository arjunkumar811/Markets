import axios from "axios";
import { useSupabase } from "./hooks/useSuparbase";
import { useUser } from "./hooks/useUser";

function App() {
  const claims = useUser();
  const supabase = useSupabase();
  const details = claims ? JSON.stringify(claims, null, 2) : "";
  const subject = claims?.sub ?? "Unavailable";
  const issuer = claims?.iss ?? "Unavailable";
  const audience =
    Array.isArray(claims?.aud) ? claims?.aud.join(", ") : claims?.aud ?? "Unavailable";

  return (
    <div className="app-shell">
      <main className="auth-card">
        <p className="eyebrow">Prediction Market</p>
        <h1>Wallet login status</h1>
        

        {!claims ? (
          <button
            className="primary-button"
            onClick={async () => {
              await supabase.auth.signInWithWeb3({
                chain: "solana",
                statement: "signin with solana web3",
              });
            }}
          >
            Sign in with Solana
          </button>
        ) : (
          <>
            <section className="details-panel">
              <h2>Signed in details</h2>
              <div className="details-grid">
                <div>
                  <span className="label">Status</span>
                  <strong>Signed in</strong>
                </div>
                <div>
                  <span className="label">Subject</span>
                  <strong>{subject}</strong>
                </div>
                <div>
                  <span className="label">Issuer</span>
                  <strong>{issuer}</strong>
                </div>
                <div>
                  <span className="label">Audience</span>
                  <strong>{audience}</strong>
                </div>
              </div>
              <pre>{details}</pre>
            </section>

            <button
              className="secondary-button"
              onClick={async () => {
                await supabase.auth.signOut();
              }}
            >
              Logout
            </button>


      <button onClick={ async () => {
        await supabase.auth.getSession().then(r => {
          console.log(r.data.session?.access_token);
          axios.post("http://localhost:3000/buy", {

          } , {
             headers: {
            Authorization: r.data.session?.access_token
          }
        })
        })
      }}>Click here to buy</button>

          </>
        )}
      </main>
    </div>
  );
}

export default App;
