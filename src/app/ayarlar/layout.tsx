import { ensureRole } from "@/lib/apiAuth";
import { redirect } from "next/navigation";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await ensureRole("admin");
  if (!user) redirect("/");
  return <>{children}</>;
}
