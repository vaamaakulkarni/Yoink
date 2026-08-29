import Link from 'next/link'

export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center px-6">
      <h1 className="font-display text-5xl font-bold tracking-tight text-[#1A1A1A]">
        Yoink<span className="text-[#FF5A1F]">.</span>
      </h1>
      <p className="text-sm text-[#8A8578] mt-2 mb-10 font-medium text-center">
        Snag dorm stuff before it hits the bin.
      </p>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <Link
          href="/signup"
          className="w-full text-center bg-[#FF5A1F] text-white rounded-2xl py-3.5 font-display font-bold hover:bg-[#E64A0F] transition-colors"
        >
          Sign Up
        </Link>
        <Link
          href="/login"
          className="w-full text-center border-2 border-[#EFE6D8] text-[#1A1A1A] rounded-2xl py-3.5 font-display font-bold hover:border-[#FF5A1F] transition-colors"
        >
          Log In
        </Link>
      </div>
    </main>
  )
}
