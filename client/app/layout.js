// app/layout.js
import "@/app/_styles/globals.css";

export const metadata = {
  title: "Encrypted Chat App",
  description: "A secure chat application with end-to-end encryption.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
