import "./globals.css";
import { getSession } from "@/lib/auth";
import Navigation from "@/components/Navigation";

export const metadata = {
  title: "miniCRM - Система Управления",
  description: "Система автоматизации работы со сделками, сырьем и производством",
};

export default async function RootLayout({ children }) {
  const session = await getSession();

  return (
    <html lang="ru">
      <body>
        {session && <Navigation session={session} />}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
