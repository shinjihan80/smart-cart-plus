export default function AdminLoading() {
  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div className="h-[60px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="h-[120px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="h-[240px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="h-[180px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="h-[140px] rounded-[32px] bg-gray-100 animate-pulse" />
    </div>
  );
}
