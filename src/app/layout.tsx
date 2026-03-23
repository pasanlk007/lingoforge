import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export const metadata = {
  title: "LingoForge",
  description: "Master Any Language in 48 Weeks",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body><FirebaseClientProvider>{children}</FirebaseClientProvider></body>
    </html>
  );
}
