import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full mt-24">
      {/* Open Source Banner */}
      <div className="border-t border-black bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="font-mono">
            <span className="text-xs uppercase tracking-widest text-black font-bold block mb-1">
              OPEN SOURCE
            </span>
            <span className="text-xs text-neutral-500">
              MIT License
            </span>
          </div>

          <a
            href="https://github.com/ParthG24/Universal_api_hub"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-surge btn-surge-white text-xs px-6 py-2.5"
          >
            STAR ON GITHUB
          </a>
        </div>
      </div>

      {/* Diagonal Striped Black Divider Banner (Screenshot 3) */}
      <div className="w-full h-14 diagonal-stripes border-t border-b border-black" />

      {/* Main Orange Footer Container */}
      <div className="relative w-full bg-[#e07850] text-black overflow-hidden pt-20 pb-28 px-6 border-b border-black">
        {/* Semi-transparent white circle overlay at bottom-left */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/20 pointer-events-none" />

        {/* Giant Watermark Text behind links */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10rem] sm:text-[14rem] md:text-[18rem] font-mono font-bold text-black/5 select-none pointer-events-none tracking-tighter whitespace-nowrap">
          universalhub
        </div>

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-10 font-mono">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <div className="font-bold text-2xl tracking-tight text-black">
              universalhub
            </div>
            <p className="text-xs text-black/80 max-w-xs leading-relaxed">
              © {new Date().getFullYear()} Universal AI Hub.
              <br />
              All rights reserved.
            </p>
          </div>

          {/* Menu */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-widest text-black/70">
              MENU
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:underline">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:underline">
                  Connectors
                </Link>
              </li>
              <li>
                <Link href="/guide" className="hover:underline">
                  User Guide
                </Link>
              </li>
              <li>
                <Link href="/connectors/content-rewriter/test" className="hover:underline">
                  Demo Playground
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-widest text-black/70">
              SOCIALS
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://github.com/ParthG24/Universal_api_hub" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Discord
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-widest text-black/70">
              CONTACT
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="mailto:admin@universalhub.dev" className="hover:underline">
                  Get in touch
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-widest text-black/70">
              LEGAL
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="#" className="hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:underline">
                  License
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
