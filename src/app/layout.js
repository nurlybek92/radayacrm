import "./globals.css";
import { getSession } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

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
        <Footer />
      </body>
    </html>
  );
}
