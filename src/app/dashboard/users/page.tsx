import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Users, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { saveUserVillageRole } from "@/app/actions";

const villages = [
  { id: "KUMO", name: "Kumogakure" },
  { id: "KONOHA", name: "Konohagakure" },
  { id: "KIRI", name: "Kirigakure" },
  { id: "IWA", name: "Iwagakure" },
  { id: "SUNA", name: "Sunagakure" }
];
const roleNames: Record<string, string> = {
  kage: "Kage",
  admin: "Administrateur",
  officer: "Officier",
  reader: "Lecteur"
};

export default async function UserManagementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: actor } = await supabase.from("profiles")
    .select("global_role,display_name").eq("id", user.id).maybeSingle();
  if (actor?.global_role !== "super_admin") redirect("/dashboard");

  const [{ data: profiles }, { data: memberships }, { data: customRoles }] = await Promise.all([
    supabase.from("profiles").select("id,display_name,global_role").order("display_name"),
    supabase.from("village_memberships")
      .select("id,user_id,village_id,role,custom_role_id,rank_label,active,created_at")
      .order("created_at", { ascending: false }),
    supabase.from("custom_roles").select("id,village_id,name,color").order("name")
  ]);

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  const users = profiles || [];

  return <main className="users-page">
    <header className="users-header">
      <Link href="/dashboard" className="back-link"><ArrowLeft size={15}/> Retour au tableau de bord</Link>
      <div className="users-title">
        <div className="users-icon"><ShieldCheck size={25}/></div>
        <div><p className="eyebrow">ESPACE FONDATEUR · ACCÈS PRIVILÉGIÉ</p><h1>Gestion des utilisateurs</h1><p>Attribue les rôles et les grades dans chacun des cinq villages.</p></div>
      </div>
      <span className="founder-only"><ShieldCheck size={14}/> Réservé au super administrateur</span>
    </header>

    <section className="users-content">
      <div className="users-warning"><ShieldCheck size={18}/><div><b>Contrôle du fondateur</b><p>Cette page et ses opérations sont protégées côté serveur. Les Kage, administrateurs et autres membres ne peuvent pas attribuer de rôles depuis cette interface.</p></div></div>

      <section className="users-panel">
        <div className="users-panel-head"><div><p className="eyebrow">NOUVELLE AFFECTATION</p><h2><UserPlus size={19}/> Attribuer un rôle</h2></div><span>{users.length} compte(s)</span></div>
        <form action={saveUserVillageRole} className="users-form">
          <div className="users-field"><label htmlFor="new-user">Utilisateur</label><select id="new-user" name="user_id" required defaultValue=""><option value="" disabled>Choisir un compte</option>{users.map(p=><option key={p.id} value={p.id}>{p.display_name || "Shinobi"} {p.global_role === "super_admin" ? "· Fondateur" : ""}</option>)}</select></div>
          <div className="users-field"><label htmlFor="new-village">Village</label><select id="new-village" name="village_id" required defaultValue="KUMO">{villages.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
          <div className="users-field"><label htmlFor="new-role">Rôle</label><select id="new-role" name="role_selection" defaultValue="legacy:reader"><optgroup label="Rôles standards">{Object.entries(roleNames).map(([value,label])=><option key={value} value={"legacy:"+value}>{label}</option>)}</optgroup>{(customRoles || []).length>0 && <optgroup label="Rôles personnalisés">{(customRoles || []).map(role=><option key={role.id} value={"custom:"+role.id}>{role.name} · {villages.find(v=>v.id===role.village_id)?.name || role.village_id}</option>)}</optgroup>}</select></div>
          <div className="users-field"><label htmlFor="new-rank">Grade RP (facultatif)</label><input id="new-rank" name="rank_label" placeholder="Ex. Jōnin, Chūnin, Genin..."/></div>
          <input type="hidden" name="active" value="true"/>
          <div className="users-submit"><button className="primary" type="submit"><UserPlus size={15}/> Attribuer le rôle</button></div>
        </form>
        <p className="users-hint">Le rôle « Lecteur » permet uniquement la consultation. L'Officier peut contribuer aux registres. L'Administrateur et le Kage peuvent gérer les accès de leur village.</p>
      </section>

      <section className="users-panel">
        <div className="users-panel-head"><div><p className="eyebrow">AFFECTATIONS EXISTANTES</p><h2><Users size={19}/> Membres et permissions</h2></div><span>{(memberships || []).length} affectation(s)</span></div>
        {(memberships || []).length === 0 ? <div className="users-empty">Aucun rôle de village attribué pour le moment.</div> :
          <div className="users-list">{(memberships || []).map(m => {
            const profile = profileMap.get(m.user_id);
            const village = villages.find(v => v.id === m.village_id);
            return <form action={saveUserVillageRole} className="member-row" key={m.id}>
              <input type="hidden" name="membership_id" value={m.id}/>
              <input type="hidden" name="user_id" value={m.user_id}/>
              <input type="hidden" name="village_id" value={m.village_id}/>
              <div className="member-identity"><div className="member-avatar">{(profile?.display_name || "S").slice(0,1).toUpperCase()}</div><div><b>{profile?.display_name || "Compte inconnu"}</b><small>{village?.name || m.village_id} · {(customRoles || []).find(role=>role.id===m.custom_role_id)?.name || roleNames[m.role] || m.role} · {m.active ? "Accès actif" : "Accès désactivé"}</small></div></div>
              <div className="users-field compact"><label>Rôle</label><select name="role_selection" defaultValue={m.custom_role_id ? "custom:"+m.custom_role_id : "legacy:"+m.role}><optgroup label="Rôles standards">{Object.entries(roleNames).map(([value,label])=><option key={value} value={"legacy:"+value}>{label}</option>)}</optgroup>{(customRoles || []).filter(role=>role.village_id===m.village_id).length>0 && <optgroup label="Rôles personnalisés">{(customRoles || []).filter(role=>role.village_id===m.village_id).map(role=><option key={role.id} value={"custom:"+role.id}>{role.name}</option>)}</optgroup>}</select></div>
              <div className="users-field compact"><label>Grade RP</label><input name="rank_label" defaultValue={m.rank_label || ""} placeholder="Non défini"/></div>
              <div className="users-field compact"><label>Accès</label><select name="active" defaultValue={String(m.active)}><option value="true">Actif</option><option value="false">Désactivé</option></select></div>
              <button className="primary member-save" type="submit">Enregistrer</button>
            </form>;
          })}</div>
        }
      </section>
      <p className="users-footnote">Le rôle fondateur est protégé séparément : cette page ne permet pas de promouvoir un autre compte au rang de super administrateur.</p>
    </section>
  </main>;
}
