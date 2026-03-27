export default function Loading() {
  return (
    <div className="min-h-screen bg-[#e2e8f0] p-8">
      {/* Skeleton Header */}
      <div className="mx-auto max-w-7xl h-20 bg-white/50 rounded-2xl animate-pulse mb-12" />
      
      <div className="mx-auto max-w-7xl grid lg:grid-cols-[1.1fr_0.9fr] gap-20">
        {/* Skeleton Hero */}
        <div className="space-y-6">
          <div className="h-4 w-32 bg-slate-300 rounded-full animate-pulse" />
          <div className="h-16 w-full bg-slate-300 rounded-2xl animate-pulse" />
          <div className="h-16 w-3/4 bg-slate-300 rounded-2xl animate-pulse" />
          <div className="h-24 w-full bg-slate-300 rounded-2xl animate-pulse" />
        </div>
        {/* Skeleton Card */}
        <div className="h-[500px] bg-white rounded-[2.5rem] shadow-xl animate-pulse" />
      </div>
    </div>
  );
}