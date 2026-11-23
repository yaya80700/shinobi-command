import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Shield, ScrollText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SanctionActions from "./sanction-actions";

const names: Record<string,{name:string;subtitle:string;symbol:string}> = {
  KONOHA:{name:"Konohagakure",subtitle:"Village caché de la Feuille",symbol:"木"},
  KUMO:{name:"Kumogakure",subtitle:"Village caché des Nuages",symbol:"雲"},
  KIRI:{name:"Kirigakure",subtitle:"Village caché de la Brume",symbol:"霧"},
  IWA:{name:"Iwagakure",subtitle:"Village caché de la Roche",symbol:"岩"},
  SUNA:{name:"Sunagakure",subtitle:"Village caché du Sable",symbol:"砂"}
};
const statusLabel: Record<string,string> = {active:"En vigueur",appealed:"Contestée",cancelled:"Annulée",served:"Effectuée"};

export default async function VillagePage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const meta=names[id];
  if(!meta) notFound();
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:profile}=await supabase.from("profiles").select("global_role").eq("id",user.id).maybeSingle();
  const {data:membership}=await supabase.from("village_memberships").select("role,rank_label,active,custom_role_id").eq("user_id",user.id).eq("village_id",id).eq("active",true).maybeSingle();
  if(profile?.global_role!=="super_admin"&&!membership) notFound();
  let customPermissions:string[]=[];
  if(membership?.custom_role_id) {
    const {data}=await supabase.from("role_permissions").select("permission_key").eq("role_id",membership.custom_role_id);
    customPermissions=(data||[]).map(x=>x.permission_key);
  }
  const isFounder=profile?.global_role==="super_admin";
  const canEditSanctions=isFounder || (membership?.custom_role_id ? customPermissions.includes("sanctions.edit") : ["admin","kage"].includes(membership?.role||""));
  const canDeleteSanctions=isFounder || (membership?.custom_role_id ? customPermissions.includes("sanctions.delete") : ["admin","kage"].includes(membership?.role||""));
  const [{data:sanctions},{data:commendations}]=await Promise.all([
    supabase.from("disciplinary_records").select("id,subject_first_name,subject_last_name,subject_rank,reason,sanction_type,sanction_detail,duration,status,incident_date").eq("village_id",id).order("incident_date",{ascending:false}).limit(100),
    supabase.from("commendations").select("id,subject_first_name,subject_last_name,subject_rank,action_type,description,reward,action_date").eq("village_id",id).order("action_date",{ascending:false}).limit(100)
  ]);
  return <main className="village-page"><header className="village-header"><Link href="/dashboard" className="back-link"><ArrowLeft size={16}/> Retour au dashboard</Link><div className="village-hero"><span>{meta.symbol}</span><div><p className="eyebrow">REGISTRE OFFICIEL · {id}</p><h1>{meta.name}</h1><p>{meta.subtitle}</p></div></div><div className="role-pill"><Shield size={14}/> {isFounder?"Super administrateur":membership?.role} {membership?.rank_label?"· "+membership.rank_label:""}</div></header>
  <div className="village-content"><div className="section-head"><div><p className="eyebrow">DOSSIERS DISCIPLINAIRES</p><h2>Sanctions <span className="count">{sanctions?.length??0}</span></h2></div></div>
  <div className="table-wrap"><table><thead><tr><th>Shinobi</th><th>Motif</th><th>Sanction</th><th>Durée</th><th>Statut</th><th>Date</th>{(canEditSanctions||canDeleteSanctions)&&<th>Actions</th>}</tr></thead><tbody>{(sanctions||[]).map(s=><tr key={s.id}><td><b>{s.subject_first_name} {s.subject_last_name}</b><small>{s.subject_rank||"Grade non précisé"}</small></td><td>{s.reason}</td><td>{s.sanction_type}</td><td>{s.duration||"—"}</td><td><span className={"status status-"+s.status}>{statusLabel[s.status]||s.status}</span></td><td>{new Date(s.incident_date+"T12:00:00").toLocaleDateString("fr-FR")}</td>{(canEditSanctions||canDeleteSanctions)&&<td><SanctionActions sanction={s} villageId={id} canEdit={canEditSanctions} canDelete={canDeleteSanctions}/></td>}</tr>)}{(!sanctions||sanctions.length===0)&&<tr><td colSpan={(canEditSanctions||canDeleteSanctions)?7:6} className="table-empty">Aucune sanction enregistrée.</td></tr>}</tbody></table></div>
  <div className="section-head second"><div><p className="eyebrow">DISTINCTIONS & CONTRIBUTIONS</p><h2>Bonnes actions <span className="count">{commendations?.length??0}</span></h2></div></div>
  <div className="table-wrap"><table><thead><tr><th>Shinobi</th><th>Catégorie</th><th>Description</th><th>Récompense</th><th>Date</th></tr></thead><tbody>{(commendations||[]).map(c=><tr key={c.id}><td><b>{c.subject_first_name} {c.subject_last_name}</b><small>{c.subject_rank||"Grade non précisé"}</small></td><td>{c.action_type}</td><td>{c.description}</td><td>{c.reward||"—"}</td><td>{new Date(c.action_date+"T12:00:00").toLocaleDateString("fr-FR")}</td></tr>)}{(!commendations||commendations.length===0)&&<tr><td colSpan={5} className="table-empty">Aucune bonne action enregistrée.</td></tr>}</tbody></table></div>
  <div className="village-note"><ScrollText size={16}/> Les registres sont filtrés par les politiques RLS de Supabase.</div></div></main>;
}
