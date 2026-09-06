import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ViewportCheck from "@/components/ViewportCheck";
export const dynamic="force-dynamic";
export default async function Page(){const user=await getSession();if(!user||user.role!=="owner")redirect("/lapangan");return <ViewportCheck/>;}
