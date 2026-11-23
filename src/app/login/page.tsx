"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      setLoading(false);
      if (error) {
        setError(error.message.includes("Password") ? "Le mot de passe doit contenir au moins 6 caractères." : "Impossible de créer le compte. Vérifie ton adresse e-mail.");
        return;
      }
      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setNotice("Compte créé ! Consulte ta boîte mail pour confirmer ton adresse avant de te connecter.");
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Identifiants incorrects ou adresse e-mail non confirmée.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  async function signInWithDiscord() {
    setError("");
    setNotice("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) {
      setLoading(false);
      setError("La connexion Discord n'est pas encore configurée. Réessaie plus tard.");
    }
  }

  return (
    <main className="login-shell">
      <div className="login-art">
        <div className="seal"><Shield size={34} /></div>
        <p className="eyebrow">CENTRE DE COMMANDEMENT</p>
        <h1>SHINOBI<br /><em>COMMAND</em></h1>
        <p className="muted">La gestion des villages, sous un même bandeau.</p>
        <div className="login-bottom">KONOHA · KUMO · KIRI · IWA · SUNA</div>
      </div>
      <section className="login-panel">
        <div className="login-card">
          <div className="mini-seal"><Shield size={20} /></div>
          <p className="eyebrow">{mode === "login" ? "ACCÈS SÉCURISÉ" : "REJOINDRE LE REGISTRE"}</p>
          <h2>{mode === "login" ? "Heureux de vous revoir." : "Créer votre compte."}</h2>
          <p className="muted">{mode === "login" ? "Connectez-vous à votre espace shinobi." : "Préparez votre accès à Shinobi Command."}</p>

          <button type="button" className="discord-button" onClick={signInWithDiscord} disabled={loading}>
            <span className="discord-mark">◈</span> Continuer avec Discord
          </button>
          <div className="login-divider"><span>OU PAR E-MAIL</span></div>

          <form onSubmit={submit}>
            {mode === "signup" && (
              <>
                <label htmlFor="displayName">Nom d'affichage</label>
                <input id="displayName" type="text" autoComplete="nickname" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Ton pseudo" minLength={2} maxLength={40} required />
              </>
            )}
            <label htmlFor="email">Adresse e-mail</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nom@exemple.fr" required />
            <label htmlFor="password">Mot de passe</label>
            <div className="password-wrap">
              <input id="password" type={visible ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="6 caractères minimum" minLength={6} required />
              <button type="button" className="eye" onClick={() => setVisible(!visible)} aria-label="Afficher le mot de passe">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {error && <p className="error">{error}</p>}
            {notice && <p className="auth-notice">{notice}</p>}
            <button className="primary full" disabled={loading}>
              {loading ? "Veuillez patienter…" : mode === "login" ? "Accéder au dashboard" : "Créer mon compte"} <span>→</span>
            </button>
          </form>

          <p className="auth-switch">
            {mode === "login" ? "Pas encore de compte ?" : "Tu as déjà un compte ?"}{" "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setNotice(""); }}>
              {mode === "login" ? "Créer un compte" : "Se connecter"}
            </button>
          </p>
          <p className="fineprint">Un compte ne donne pas automatiquement accès aux villages. Un administrateur doit t'attribuer un rôle et des permissions.</p>
        </div>
      </section>
    </main>
  );
}
