// Login page bypasses the admin auth layout
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
