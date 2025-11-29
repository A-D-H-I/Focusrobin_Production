import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAllOrders } from "@/app/actions/orders";
import OrdersManagement from "./OrdersManagement";

export default async function AdminOrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    redirect("/");
  }

  const result = await getAllOrders();
  const orders = result.success ? result.orders : [];

  return <OrdersManagement initialOrders={orders} />;
}

