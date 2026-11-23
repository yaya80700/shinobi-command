"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

export async function createSanction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expirée.");
  const payload = {
    village_id: String(formData.get("village_id") || ""),
    subject_first_name: String(formData.get("first_name") || "").trim(),
    subject_last_name: String(formData.get("last_name") || "").trim(),
    subject_rank: String(formData.get("rank") || "").trim() || null,
    reason: String(formData.get("reason") || "").trim(),
    sanction_type: String(formData.get("sanction_type") || "").trim(),
    sanction_detail: String(formData.get("detail") || "").trim(),
    duration: String(formData.get("duration") || "").trim() || null,
    incident_date: String(formData.get("incident_date") || ""),
    created_by: user.id
  };
  const { error } = await supabase.from("disciplinary_records").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function createCommendation(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expirée.");
  const payload = {
    village_id: String(formData.get("village_id") || ""),
    subject_first_name: String(formData.get("first_name") || "").trim(),
    subject_last_name: String(formData.get("last_name") || "").trim(),
    subject_rank: String(formData.get("rank") || "").trim() || null,
    action_type: String(formData.get("action_type") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    reward: String(formData.get("reward") || "").trim() || null,
    action_date: String(formData.get("action_date") || ""),
    created_by: user.id
  };
  const { error } = await supabase.from("commendations").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function saveUserVillageRole(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expirée.");

  // Vérification côté serveur : seul le super administrateur peut gérer les affectations.
  const { data: actor, error: actorError } = await supabase
    .from("profiles").select("global_role").eq("id", user.id).maybeSingle();
  if (actorError || actor?.global_role !== "super_admin") {
    throw new Error("Accès réservé au fondateur.");
  }

  const targetUserId = String(formData.get("user_id") || "");
  const villageId = String(formData.get("village_id") || "");
  const role = String(formData.get("role") || "");
  const rankLabel = String(formData.get("rank_label") || "").trim() || null;
  const active = String(formData.get("active") || "") === "true";
  const membershipId = String(formData.get("membership_id") || "");

  if (!targetUserId || !["KUMO", "KONOHA", "KIRI", "IWA", "SUNA"].includes(villageId)) {
    throw new Error("Utilisateur ou village invalide.");
  }
  if (!["kage", "admin", "officer", "reader"].includes(role)) {
    throw new Error("Rôle de village invalide.");
  }

  const { data: target } = await supabase.from("profiles").select("id").eq("id", targetUserId).maybeSingle();
  if (!target) throw new Error("Ce compte est introuvable.");

  let result;
  if (membershipId) {
    result = await supabase.from("village_memberships")
      .update({ role, rank_label: rankLabel, active })
      .eq("id", membershipId).eq("user_id", targetUserId).eq("village_id", villageId);
  } else {
    const { data: existing } = await supabase.from("village_memberships")
      .select("id").eq("user_id", targetUserId).eq("village_id", villageId).maybeSingle();
    if (existing) {
      result = await supabase.from("village_memberships")
        .update({ role, rank_label: rankLabel, active }).eq("id", existing.id);
    } else {
      result = await supabase.from("village_memberships")
        .insert({ user_id: targetUserId, village_id: villageId, role, rank_label: rankLabel, active, permissions: {} });
    }
  }
  if (result?.error) throw new Error(result.error.message);

  await supabase.from("audit_logs").insert({
    village_id: villageId,
    actor_id: user.id,
    action: membershipId ? "Modification des droits d'un membre" : "Attribution d'un rôle de village",
    entity_type: "village_membership",
    details: { target_user_id: targetUserId, role, rank_label: rankLabel, active }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/users");
}
