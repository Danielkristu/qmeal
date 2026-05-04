export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-w-[480px] mx-auto w-full min-h-screen relative bg-background">
      {children}
    </div>
  )
}
