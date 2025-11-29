import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAdminChats } from "@/app/actions/chat";
import ChatManagement from "./ChatManagement";

export default async function AdminChatsPage() {
  const session = await auth();

  // Server-side check: redirect if not logged in or not admin
  if (!session?.user) {
    redirect("/");
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    redirect("/");
  }

  const chatsResult = await getAdminChats();
  const chats = chatsResult.success ? chatsResult.chats : [];

  return <ChatManagement initialChats={chats} />;
}

