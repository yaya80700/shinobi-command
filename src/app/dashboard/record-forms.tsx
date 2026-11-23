"use client";
import { useState } from "react";
import { createSanction, createCommendation } from "@/app/actions";
import { Plus, Award, ScrollText } from "lucide-react";

type Village={id:string;name:string};
export default function RecordForms({villages,defaultVillage}:{villages:Village[];defaultVillage:string}) {
  const [tab,setTab]=useState<"sanction"|"commendation">("sanction");
  if (!villages.length) return <div className="empty">Attribuez-vous un village pour commencer à créer des dossiers.</div>;
  return <section className="record-panel">
    <div className="tabs"><button className={tab==="sanction"?"tab selected":"tab"} onClick={()=>setTab("sanction")}><ScrollText size={16}/> Nouvelle sanction</button><button className={tab==="commendation"?"tab selected":"tab"} onClick={()=>setTab("commendation")}><Award size={16}/> Bonne action</button></div>
    {tab==="sanction"?<form action={createSanction} className="record-form">
      <div className="field"><label>Village</label><select name="village_id" defaultValue={defaultVillage}>{villages.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
      <div className="field"><label>Prénom</label><input name="first_name" required placeholder="Prénom du shinobi"/></div><div className="field"><label>Nom</label><input name="last_name" required placeholder="Nom du shinobi"/></div>
      <div className="field"><label>Grade</label><input name="rank" placeholder="Ex. Jônin"/></div><div className="field"><label>Type de sanction</label><select name="sanction_type" required><option value="">Choisir…</option><option>Avertissement</option><option>Blâme</option><option>Retrait de grade</option><option>Suspension</option><option>Exclusion</option><option>Autre</option></select></div>
      <div className="field"><label>Date des faits</label><input type="date" name="incident_date" required defaultValue={new Date().toISOString().slice(0,10)}/></div>
      <div className="field wide"><label>Motif</label><input name="reason" required placeholder="Motif de la sanction"/></div><div className="field wide"><label>Détail / décision</label><textarea name="detail" required rows={3} placeholder="Décrire les faits et la décision prise…"/></div><div className="field"><label>Durée</label><input name="duration" placeholder="Ex. 3 jours / définitif"/></div>
      <div className="form-end"><span>La base de données contrôle les droits selon votre rôle.</span><button className="primary"><Plus size={16}/> Enregistrer</button></div>
    </form>:<form action={createCommendation} className="record-form">
      <div className="field"><label>Village</label><select name="village_id" defaultValue={defaultVillage}>{villages.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
      <div className="field"><label>Prénom</label><input name="first_name" required/></div><div className="field"><label>Nom</label><input name="last_name" required/></div><div className="field"><label>Grade</label><input name="rank" placeholder="Ex. Chûnin"/></div>
      <div className="field"><label>Catégorie</label><select name="action_type" required><option value="">Choisir…</option><option>Mission</option><option>Entraînement</option><option>Service au village</option><option>Acte héroïque</option><option>Progression</option><option>Autre</option></select></div><div className="field"><label>Date</label><input type="date" name="action_date" required defaultValue={new Date().toISOString().slice(0,10)}/></div>
      <div className="field wide"><label>Description</label><textarea name="description" required rows={3} placeholder="Décrire l'action remarquable…"/></div><div className="field wide"><label>Récompense (facultatif)</label><input name="reward" placeholder="Ex. Promotion, points, distinction…"/></div>
      <div className="form-end"><span>La base de données contrôle les droits selon votre rôle.</span><button className="primary"><Plus size={16}/> Enregistrer</button></div>
    </form>}
  </section>;
}