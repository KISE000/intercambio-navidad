export default function WishListSkeleton() {
  // Generamos un array de 6 elementos para simular varias tarjetas
  const skeletons = Array(6).fill(0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {skeletons.map((_, index) => (
        <div 
          key={index} 
          className="bg-[#151923] border border-white/5 rounded-3xl p-8 relative overflow-hidden"
        >
          {/* Efecto Shimmer (Brillo que pasa) */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

          {/* Header Skeleton */}
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2 w-3/4">
              <div className="h-6 bg-slate-800 rounded-md w-full animate-pulse"></div>
              <div className="h-3 bg-slate-800 rounded-md w-1/2 animate-pulse"></div>
            </div>
            <div className="w-8 h-8 bg-slate-800 rounded-full animate-pulse"></div>
          </div>

          {/* Detalles Skeleton */}
          <div className="space-y-2 mb-6">
            <div className="h-3 bg-slate-800 rounded-md w-full animate-pulse"></div>
            <div className="h-3 bg-slate-800 rounded-md w-5/6 animate-pulse"></div>
            <div className="h-3 bg-slate-800 rounded-md w-4/6 animate-pulse"></div>
          </div>

          {/* Footer Skeleton */}
          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <div className="h-6 bg-slate-800 rounded-full w-20 animate-pulse"></div>
            <div className="w-10 h-10 bg-slate-800 rounded-md animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}