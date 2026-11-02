import {AnimatedAtmosphere} from '@/components/ui/animated-atmosphere';
export function MarketplaceShell({children}:{children:React.ReactNode}){return <main className="relative min-h-screen bg-[#050611] px-5 py-12 text-white"><AnimatedAtmosphere/><div className="relative mx-auto max-w-6xl">{children}</div></main>;}
