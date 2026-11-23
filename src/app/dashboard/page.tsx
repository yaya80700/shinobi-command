import { redirect } from "next/navigation";
import { Shield, Users, ScrollText, Award, Activity, LogOut, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import RecordForms from "./record-forms";

const villageMeta: Record<string,{name:string;subtitle:string;symbol:string}> = {
  KONOHA:{name:"Konohagakure",subtitle:"Village caché de la Feuille",symbol:"木"},
  KUMO:{name:"Kumogakure",subtitle:"Village caché des Nuages",symbol:"雲"},
  KIRI:{name:"Kirigakure",subtitle:"Village caché de la Brume",symbol:"霧"},
  IWA:{name:"Iwagakure",subtitle:"Village caché de la Roche",symbol:"岩"},
  SUNA:{name:"Sunagakure",subtitle:"Village caché du Sable",symbol:"砂"}
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{data:profile},{data:memberships},{data:villages},{count:sanctionCount},{count:commendationCount},{data:recent}] = await Promise.all([
    supabase.from("profiles").select("display_name,global_role").eq("id",user.id).maybeSingle(),
    supabase.from("village_memberships").select("id,village_id,role,rank_label,permissions,active").eq("user_id",user.id).eq("active",true),
    supabase.from("villages").select("id,name,subtitle,accent").order("name"),
    supabase.from("disciplinary_records").select("*",{count:"exact",head:true}),
    supabase.from("commendations").select("*",{count:"exact",head:true}),
    supabase.from("audit_logs").select("id,action,entity_type,created_at,village_id").order("created_at",{ascending:false}).limit(6)
  ]);
  const allowed = new Set((memberships||[]).map(m=>m.village_id));
  const visibleVillages = profile?.global_role==="super_admin" ? (villages||[]) : (villages||[]).filter(v=>allowed.has(v.id));
  const selected = visibleVillages[0]?.id || "";
  const displayName = profile?.display_name || user.email?.split("@")[0] || "Shinobi";
  const roleLabel = profile?.global_role==="super_admin" ? "Super administrateur" : memberships?.[0]?.role || "Membre";
  return <main className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-icon"><Shield size={22}/></div><div><b>SHINOBI</b><small>COMMAND</small></div></div><div className="side-label">ESPACE DE TRAVAIL</div><a className="nav active"><Activity size={17}/> Vue générale</a>{profile?.global_role === "super_admin" && <><a className="nav" href="/dashboard/users"><Users size={17}/> Gestion des utilisateurs <ChevronRight size={15}/></a><a className="nav" href="/dashboard/roles"><Shield size={17}/> Rôles & permissions <ChevronRight size={15}/></a></>}<a className="nav" href="#villages"><Shield size={17}/> Villages <ChevronRight size={15}/></a><a className="nav" href="#registre"><ScrollText size={17}/> Registres <ChevronRight size={15}/></a><a className="nav" href="#activite"><Award size={17}/> Activité</a><div className="sidebar-bottom"><div className="user-chip"><div className="avatar">{displayName.slice(0,1).toUpperCase()}</div><div><b>{displayName}</b><small>{roleLabel}</small></div></div><form action={signOut}><button className="logout"><LogOut size={16}/> Déconnexion</button></form></div></aside>
  <section className="main-area"><header className="topbar"><div><span className="eyebrow">CENTRE DE COMMANDEMENT</span><h1>Vue générale</h1></div><div className="top-user"><span className="status-dot"/> Système opérationnel <div className="avatar small">{displayName.slice(0,1).toUpperCase()}</div></div></header>
  <div className="content"><section className="welcome"><div><p className="eyebrow">RAPPORT DE SITUATION</p><h2>Bienvenue, {displayName}.</h2><p>Les cinq grandes nations. Un seul centre de gestion.</p></div><div className="welcome-mark">忍</div></section>
  <div className="stats"><article className="stat"><div className="stat-icon red"><ScrollText size={19}/></div><span>Sanctions enregistrées</span><strong>{sanctionCount??0}</strong><small>Tous villages accessibles</small></article><article className="stat"><div className="stat-icon gold"><Award size={19}/></div><span>Bonnes actions</span><strong>{commendationCount??0}</strong><small>Distinctions consignées</small></article><article className="stat"><div className="stat-icon blue"><Users size={19}/></div><span>Vos affectations</span><strong>{profile?.global_role==="super_admin"?"5":visibleVillages.length}</strong><small>Villages accessibles</small></article></div>
  <section id="villages" className="section-head"><div><p className="eyebrow">NATIONS SHINOBI</p><h2>Vos villages</h2></div><span className="muted">{visibleVillages.length} accessible(s)</span></section>
  <div className="village-grid">{visibleVillages.map(v=>{const meta=villageMeta[v.id]||{name:v.name,subtitle:v.subtitle,symbol:"忍"};return <a className="village-card" href={`/dashboard/village/${v.id}`} key={v.id}><div className="village-top"><span className="village-symbol">{meta.symbol}</span><span className="village-open">Ouvrir <ChevronRight size={15}/></span></div><h3>{meta.name}</h3><p>{meta.subtitle}</p><div className="village-line"/></a>})}{visibleVillages.length===0&&<div className="empty">Aucun village ne vous est encore attribué. Contactez le super administrateur.</div>}</div>
  <section id="registre" className="section-head"><div><p className="eyebrow">GESTION DISCIPLINAIRE</p><h2>Registres rapides</h2></div></section>
  <RecordForms villages={visibleVillages.map(v=>({id:v.id,name:villageMeta[v.id]?.name||v.name}))} defaultVillage={selected}/>
  <section id="activite" className="section-head"><div><p className="eyebrow">TRAÇABILITÉ</p><h2>Activité récente</h2></div></section><div className="activity-list">{(recent||[]).map(log=><div className="activity-row" key={log.id}><div className="activity-dot"/><div><b>{log.action}</b><p>{log.entity_type} · {log.village_id||"Administration centrale"}</p></div><time>{new Date(log.created_at).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"})}</time></div>)}{(!recent||recent.length===0)&&<p className="muted empty-activity">Aucune activité enregistrée pour le moment.</p>}</div>
  <footer>SHINOBI COMMAND <span>·</span> Administration des cinq grandes nations</footer></div></section></main>;
}