"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError("Identifiants incorrects ou compte non autorisé."); return; }
    router.replace("/dashboard"); router.refresh();
  }

  return <main className="login-shell">
    <div className="login-art"><div className="seal"><Shield size={34}/></div><p className="eyebrow">CENTRE DE COMMANDEMENT</p><h1>SHINOBI<br/><em>COMMAND</em></h1><p className="muted">La gestion des villages, sous un même bandeau.</p><div className="login-bottom">KONOHA · KUMO · KIRI · IWA · SUNA</div></div>
    <section className="login-panel"><div className="login-card"><div className="mini-seal"><Shield size={20}/></div><p className="eyebrow">ACCÈS SÉCURISÉ</p><h2>Heureux de vous revoir.</h2><p className="muted">Connectez-vous à votre espace shinobi.</p>
      <form onSubmit={submit}><label>Adresse e-mail</label><input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nom@exemple.fr" required/>
      <label>Mot de passe</label><div className="password-wrap"><input type={visible?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Votre mot de passe" required/><button type="button" className="eye" onClick={()=>setVisible(!visible)} aria-label="Afficher le mot de passe">{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
      {error && <p className="error">{error}</p>}<button className="primary full" disabled={loading}>{loading?"Connexion…":"Accéder au dashboard"} <span>→</span></button></form>
      <p className="fineprint">Les comptes sont créés par un administrateur. Aucune inscription publique.</p></div></section>
  </main>;
}