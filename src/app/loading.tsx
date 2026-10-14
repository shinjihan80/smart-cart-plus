export default function Loading() {
  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div className="h-[130px] rounded-card bg-gray-100 animate-pulse" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-[120px] rounded-card bg-gray-100 animate-pulse" />
        <div className="h-[120px] rounded-card bg-gray-100 animate-pulse" />
      </div>
      <div className="h-[160px] rounded-card bg-gray-100 animate-pulse" />
    </div>
  );
}
