export default function ManualLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="manual-scroll" className="fixed inset-0 z-50 overflow-y-auto bg-white">
      {children}
    </div>
  );
}
