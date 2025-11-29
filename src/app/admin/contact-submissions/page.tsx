import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getContactSubmissions } from "@/app/actions/contactSubmissions";
import ContactSubmissionsManagement from "./ContactSubmissionsManagement";

export default async function ContactSubmissionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    redirect("/");
  }

  const result = await getContactSubmissions();
  const submissions = result.success ? result.submissions : [];

  return <ContactSubmissionsManagement initialSubmissions={submissions} />;
}

