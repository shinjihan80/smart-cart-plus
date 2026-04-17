export default function ClosetLoading() {
  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div className="h-[80px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="h-[40px] rounded-2xl bg-gray-100 animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[100px] rounded-[32px] bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}
