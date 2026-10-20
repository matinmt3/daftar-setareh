import type { SerializedActionResult } from "@/lib/types";

/** Network failures must leave a form editable and keep optimistic state reversible. */
export async function runAction<T>(action: () => Promise<SerializedActionResult<T>>): Promise<SerializedActionResult<T>> {
  try {
    return await action();
  } catch (error) {
    // Next redirects are control flow, including successful account deletion.
    if (error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) throw error;
    return { ok: false, message: "ارتباط با سرور برقرار نشد. دوباره تلاش کن؛ اطلاعات فرم حفظ شده است." };
  }
}
