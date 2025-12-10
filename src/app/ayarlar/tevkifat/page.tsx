import { ensureRole } from "@/lib/apiAuth";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Table, TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { redirect } from "next/navigation";
import ClientTevkifat from "./ClientTevkifat";

export default async function TevkifatSettingsPage() {
  const user = await ensureRole("admin");
  if (!user) redirect("/");
  const initial = await prisma.withholdingJobType.findMany({
    orderBy: [{ sort: "asc" }, { code: "asc" }],
    select: { code: true, label: true, ratio: true, active: true },
  });
  return <ClientTevkifat initialItems={initial} />;
}
 
