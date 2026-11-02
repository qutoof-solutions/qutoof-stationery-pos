import { redirect } from "next/navigation";
import { HrModule } from "@/components/operations/hr-module";
import { getPageContext } from "@/lib/server/page-access";
import { roleCanAccessDashboardRole } from "@/lib/operations/permissions";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function HrPage() {
  const context = await getPageContext();
  if (!roleCanAccessDashboardRole(context.session.role, ["business_admin"])) redirect("/dashboard");
  return <HrModule />;
}
