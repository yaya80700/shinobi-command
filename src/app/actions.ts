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
  const roleSelection = String(formData.get("role_selection") || "legacy:reader");
  const customRoleId = roleSelection.startsWith("custom:") ? roleSelection.slice(7) : "";
  const role = roleSelection.startsWith("legacy:") ? roleSelection.slice(7) : "reader";
  const rankLabel = String(formData.get("rank_label") || "").trim() || null;
  const active = String(formData.get("active") || "") === "true";
  const membershipId = String(formData.get("membership_id") || "");

  if (!targetUserId || !["KUMO", "KONOHA", "KIRI", "IWA", "SUNA"].includes(villageId)) {
    throw new Error("Utilisateur ou village invalide.");
  }
  if (!customRoleId && !["kage", "admin", "officer", "reader"].includes(role)) {
    throw new Error("Rôle de village invalide.");
  }
  if (customRoleId) {
    const { data: customRole } = await supabase.from("custom_roles").select("id").eq("id", customRoleId).eq("village_id", villageId).maybeSingle();
    if (!customRole) throw new Error("Ce rôle personnalisé n’existe pas dans ce village.");
  }

  const { data: target } = await supabase.from("profiles").select("id").eq("id", targetUserId).maybeSingle();
  if (!target) throw new Error("Ce compte est introuvable.");

  let result;
  if (membershipId) {
    result = await supabase.from("village_memberships")
      .update({ role: customRoleId ? "reader" : role, custom_role_id: customRoleId || null, rank_label: rankLabel, active })
      .eq("id", membershipId).eq("user_id", targetUserId).eq("village_id", villageId);
  } else {
    const { data: existing } = await supabase.from("village_memberships")
      .select("id").eq("user_id", targetUserId).eq("village_id", villageId).maybeSingle();
    if (existing) {
      result = await supabase.from("village_memberships")
        .update({ role: customRoleId ? "reader" : role, custom_role_id: customRoleId || null, rank_label: rankLabel, active }).eq("id", existing.id);
    } else {
      result = await supabase.from("village_memberships")
        .insert({ user_id: targetUserId, village_id: villageId, role: customRoleId ? "reader" : role, custom_role_id: customRoleId || null, rank_label: rankLabel, active, permissions: {} });
    }
  }
  if (result?.error) throw new Error(result.error.message);

  await supabase.from("audit_logs").insert({
    village_id: villageId,
    actor_id: user.id,
    action: membershipId ? "Modification des droits d'un membre" : "Attribution d'un rôle de village",
    entity_type: "village_membership",
    details: { target_user_id: targetUserId, role: customRoleId || role, rank_label: rankLabel, active }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/users");
}


async function requireFounder() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expirée.");
  const { data: actor, error } = await supabase.from("profiles").select("global_role").eq("id", user.id).maybeSingle();
  if (error || actor?.global_role !== "super_admin") throw new Error("Action réservée au fondateur.");
  return { supabase, user };
}

export async function saveCustomRole(formData: FormData) {
  const { supabase, user } = await requireFounder();
  const roleId = String(formData.get("role_id") || "");
  const villageId = String(formData.get("village_id") || "");
  const name = String(formData.get("name") || "").trim().slice(0, 50);
  const description = String(formData.get("description") || "").trim().slice(0, 240);
  const color = String(formData.get("color") || "#c4a36a");
  const permissionKeys = [...new Set(formData.getAll("permission_keys").map(String))];

  if (!["KUMO", "KONOHA", "KIRI", "IWA", "SUNA"].includes(villageId)) throw new Error("Village invalide.");
  if (!name) throw new Error("Le nom du rôle est obligatoire.");
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) throw new Error("Couleur invalide.");

  const { data: validPermissions, error: permissionError } = permissionKeys.length
    ? await supabase.from("permission_catalog").select("key").in("key", permissionKeys).eq("active", true)
    : { data: [], error: null };
  if (permissionError) throw new Error(permissionError.message);
  if ((validPermissions || []).length !== permissionKeys.length) throw new Error("Une permission sélectionnée est inconnue.");

  let savedRoleId = roleId;
  if (roleId) {
    const { data: existingRole } = await supabase.from("custom_roles").select("id").eq("id", roleId).eq("village_id", villageId).maybeSingle();
    if (!existingRole) throw new Error("Ce rôle n’existe pas dans ce village.");
    const { error } = await supabase.from("custom_roles")
      .update({ name, description, color, updated_at: new Date().toISOString() })
      .eq("id", roleId).eq("village_id", villageId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from("custom_roles")
      .insert({ village_id: villageId, name, description, color, created_by: user.id })
      .select("id").single();
    if (error) throw new Error(error.message);
    savedRoleId = data.id;
  }

  const { error: deleteError } = await supabase.from("role_permissions").delete().eq("role_id", savedRoleId);
  if (deleteError) throw new Error(deleteError.message);
  if (permissionKeys.length) {
    const { error } = await supabase.from("role_permissions")
      .insert(permissionKeys.map(permission_key => ({ role_id: savedRoleId, permission_key })));
    if (error) throw new Error(error.message);
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id, village_id: villageId,
    action: roleId ? "Modification d'un rôle personnalisé" : "Création d'un rôle personnalisé",
    entity_type: "custom_role", entity_id: savedRoleId,
    details: { name, permission_keys: permissionKeys }
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/roles");
}

export async function deleteCustomRole(formData: FormData) {
  const { supabase, user } = await requireFounder();
  const roleId = String(formData.get("role_id") || "");
  if (!roleId) throw new Error("Rôle introuvable.");
  const { data: role } = await supabase.from("custom_roles").select("id,village_id,name").eq("id", roleId).maybeSingle();
  if (!role) throw new Error("Ce rôle n’existe pas.");
  const { error } = await supabase.from("custom_roles").delete().eq("id", roleId);
  if (error) throw new Error(error.message);
  await supabase.from("audit_logs").insert({
    actor_id: user.id, village_id: role.village_id,
    action: "Suppression d'un rôle personnalisé", entity_type: "custom_role",
    details: { name: role.name, role_id: roleId }
  });
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/roles");
}
