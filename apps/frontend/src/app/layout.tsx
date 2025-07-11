import './globals.css';
import { ThemeProvider } from 'next-themes';

export const metadata = {
  title: 'Mistral Invoice Parser',
  description: 'Parse invoices using Mistral AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
