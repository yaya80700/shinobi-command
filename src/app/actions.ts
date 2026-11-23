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