"use client";
import { useState } from "react";
import { updateSanction, deleteSanction } from "@/app/actions";
import { Pencil, Trash2, X, Save } from "lucide-react";

type Sanction = {
  id:string; subject_first_name:string; subject_last_name:string; subject_rank:string|null;
  reason:string; sanction_type:string; sanction_detail:string|null; duration:string|null;
  status:string; incident_date:string;
};
const statusLabels:Record<string,string>={active:"En vigueur",appealed:"Contestée",cancelled:"Annulée",served:"Effectuée"};

export default function SanctionActions({sanction,villageId,canEdit,canDelete}:{sanction:Sanction;villageId:string;canEdit:boolean;canDelete:boolean}) {
  const [editing,setEditing]=useState(false);
  if (!canEdit && !canDelete) return null;
  return <div className="sanction-actions">
    {canEdit && <button type="button" className="secondary small-action" onClick={()=>setEditing(!editing)}>{editing?<X size={14}/>:<Pencil size={14}/>} {editing?"Fermer":"Modifier"}</button>}
    {canDelete && <form action={deleteSanction} onSubmit={(e)=>{if(!confirm("Supprimer définitivement cette sanction ?")) e.preventDefault();}}><input type="hidden" name="sanction_id" value={sanction.id}/><input type="hidden" name="village_id" value={villageId}/><button className="danger small-action"><Trash2 size={14}/> Supprimer</button></form>}
    {editing && canEdit && <form action={updateSanction} className="sanction-edit-form">
      <input type="hidden" name="sanction_id" value={sanction.id}/><input type="hidden" name="village_id" value={villageId}/>
      <label>Prénom<input name="first_name" defaultValue={sanction.subject_first_name} required/></label>
      <label>Nom<input name="last_name" defaultValue={sanction.subject_last_name} required/></label>
      <label>Grade<input name="rank" defaultValue={sanction.subject_rank||""}/></label>
      <label>Type<select name="sanction_type" defaultValue={sanction.sanction_type}><option>Avertissement</option><option>Blâme</option><option>Retrait de grade</option><option>Suspension</option><option>Exclusion</option><option>Autre</option></select></label>
      <label>Motif<input name="reason" defaultValue={sanction.reason} required/></label>
      <label>Durée<input name="duration" defaultValue={sanction.duration||""}/></label>
      <label>Date<input type="date" name="incident_date" defaultValue={sanction.incident_date} required/></label>
      <label>Statut<select name="status" defaultValue={sanction.status}><option value="active">En vigueur</option><option value="appealed">Contestée</option><option value="cancelled">Annulée</option><option value="served">Effectuée</option></select></label>
      <label className="edit-wide">Détail / décision<textarea name="detail" rows={3} defaultValue={sanction.sanction_detail||""}/></label>
      <button className="primary edit-wide"><Save size={15}/> Enregistrer les modifications</button>
    </form>}
  </div>;
}
