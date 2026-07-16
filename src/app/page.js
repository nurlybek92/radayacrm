import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const role = session.role;
  if (role === "director" || role === "accountant") {
    redirect("/dashboard");
  } else if (role === "production") {
    redirect("/production");
  } else if (role === "sales") {
    redirect("/sales");
  } else {
    redirect("/login");
  }
}
