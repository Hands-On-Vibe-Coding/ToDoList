import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ToDo App - 바이브 코딩',
  description: '바이브 코딩으로 만든 ToDo 애플리케이션',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}