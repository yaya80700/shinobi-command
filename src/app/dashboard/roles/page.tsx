import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Plus, Trash2, Save, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { saveCustomRole, deleteCustomRole } from "@/app/actions";

const villages = [
  { id: "KUMO", name: "Kumogakure" },
  { id: "KONOHA", name: "Konohagakure" },
  { id: "KIRI", name: "Kirigakure" },
  { id: "IWA", name: "Iwagakure" },
  { id: "SUNA", name: "Sunagakure" }
];

export default async function RoleManagementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: actor } = await supabase.from("profiles").select("global_role").eq("id", user.id).maybeSingle();
  if (actor?.global_role !== "super_admin") redirect("/dashboard");

  const [{ data: permissions }, { data: roles }, { data: rolePermissions }] = await Promise.all([
    supabase.from("permission_catalog").select("key,category,label,description,sort_order,implemented").eq("active", true).order("sort_order"),
    supabase.from("custom_roles").select("id,village_id,name,description,color").order("village_id").order("name"),
    supabase.from("role_permissions").select("role_id,permission_key")
  ]);

  const permissionGroups = new Map<string, NonNullable<typeof permissions>>();
  for (const permission of permissions || []) {
    const group = permissionGroups.get(permission.category) || [];
    group.push(permission);
    permissionGroups.set(permission.category, group);
  }
  const selectedByRole = new Map<string, Set<string>>();
  for (const item of rolePermissions || []) {
    const set = selectedByRole.get(item.role_id) || new Set<string>();
    set.add(item.permission_key);
    selectedByRole.set(item.role_id, set);
  }
  const villageName = (id: string) => villages.find(v => v.id === id)?.name || id;

  const PermissionChoices = ({ selected = new Set<string>() }: { selected?: Set<string> }) => (
    <div className="permission-groups">
      {[...permissionGroups.entries()].map(([category, items]) => (
        <fieldset className="permission-group" key={category}>
          <legend>{category}</legend>
          <div className="permission-grid">
            {items.map(permission => (
              <label className="permission-choice" key={permission.key}>
                <input type="checkbox" name="permission_keys" value={permission.key} defaultChecked={selected.has(permission.key)}/>
                <span><b>{permission.label} <i className={permission.implemented ? "permission-status ready" : "permission-status planned"}>{permission.implemented ? "Actif" : "À venir"}</i></b><small>{permission.description}</small></span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );

  return <main className="users-page">
    <header className="users-header">
      <Link href="/dashboard" className="back-link"><ArrowLeft size={15}/> Retour au tableau de bord</Link>
      <div className="users-title"><div className="users-icon"><KeyRound size={25}/></div><div><p className="eyebrow">ESPACE FONDATEUR · CONTRÔLE DES ACCÈS</p><h1>Rôles & permissions</h1><p>Compose tes propres profils d’accès, permission par permission.</p></div></div>
      <span className="founder-only"><ShieldCheck size={14}/> Réservé au super administrateur</span>
    </header>
    <section className="users-content">
      <div className="users-warning"><ShieldCheck size={18}/><div><b>Tu contrôles chaque droit</b><p>Un rôle ne donne que les permissions cochées. Les permissions sont contrôlées côté serveur et dans les règles d’accès de la base de données, pas uniquement masquées dans l’interface.</p></div></div>

      <section className="users-panel">
        <div className="users-panel-head"><div><p className="eyebrow">NOUVEAU PROFIL</p><h2><Plus size={19}/> Créer un rôle personnalisé</h2></div></div>
        <form action={saveCustomRole} className="role-editor">
          <div className="role-meta-grid">
            <div className="users-field"><label>Nom du rôle</label><input name="name" required maxLength={50} placeholder="Ex. Bras droit du Kage"/></div>
            <div className="users-field"><label>Village concerné</label><select name="village_id" defaultValue="KUMO">{villages.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
            <div className="users-field"><label>Couleur</label><input name="color" type="color" defaultValue="#c4a36a"/></div>
            <div className="users-field"><label>Description</label><input name="description" maxLength={240} placeholder="Responsabilités de ce rôle"/></div>
          </div>
          <div className="permission-heading"><div><b>Permissions accordées</b><small>Coche les droits à accorder. « Actif » est déjà appliqué ; « À venir » sera branché lorsque le module correspondant sera développé.</small></div><span>{(permissions || []).length} permissions disponibles</span></div>
          <PermissionChoices/>
          <div className="role-actions"><button className="primary" type="submit"><Plus size={15}/> Créer le rôle</button></div>
        </form>
      </section>

      <section className="users-panel">
        <div className="users-panel-head"><div><p className="eyebrow">PROFILS EXISTANTS</p><h2><ShieldCheck size={19}/> Rôles personnalisés</h2></div><span>{(roles || []).length} rôle(s)</span></div>
        {(roles || []).length === 0 ? <div className="users-empty">Aucun rôle personnalisé pour le moment.</div> :
          <div className="custom-role-list">
            {(roles || []).map(role => (
              <details className="custom-role-card" key={role.id}>
                <summary><span className="role-color" style={{background:role.color}}/><span className="role-summary-main"><b>{role.name}</b><small>{villageName(role.village_id)} · {(selectedByRole.get(role.id)?.size || 0)} permission(s)</small></span><span className="role-edit-hint">Modifier les permissions ↓</span></summary>
                <form action={saveCustomRole} className="role-editor role-edit-form">
                  <input type="hidden" name="role_id" value={role.id}/>
                  <div className="role-meta-grid">
                    <div className="users-field"><label>Nom du rôle</label><input name="name" required maxLength={50} defaultValue={role.name}/></div>
                    <div className="users-field"><label>Village</label><input value={villageName(role.village_id)} readOnly/><input type="hidden" name="village_id" value={role.village_id}/></div>
                    <div className="users-field"><label>Couleur</label><input name="color" type="color" defaultValue={role.color}/></div>
                    <div className="users-field"><label>Description</label><input name="description" maxLength={240} defaultValue={role.description}/></div>
                  </div>
                  <PermissionChoices selected={selectedByRole.get(role.id) || new Set<string>()}/>
                  <div className="role-actions"><button className="primary" type="submit"><Save size={15}/> Enregistrer les permissions</button></div>
                </form>
                <form action={deleteCustomRole} className="delete-role-form"><input type="hidden" name="role_id" value={role.id}/><button type="submit" className="danger-button"><Trash2 size={14}/> Supprimer ce rôle</button></form>
              </details>
            ))}
          </div>
        }
      </section>
      <p className="users-footnote">Les rôles personnalisés sont propres à un village. Un même joueur peut donc avoir un rôle différent à Kumo et à Konoha. Le super administrateur reste protégé et ne peut pas être créé depuis cette page.</p>
    </section>
  </main>;
}
