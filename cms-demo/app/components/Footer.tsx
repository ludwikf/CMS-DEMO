import { DEMO_FOOTER_LABEL } from "@/lib/branding";

export default function Footer() {
  return (
    <footer className="mt-auto py-2.5 px-4 sm:px-12 text-xs text-[#64748b] dark:text-[#666] bg-[#eaecef] dark:bg-[#111111] border-t border-[#e2e4e8] dark:border-[#1a1a1a]">
      <div className="mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-2">
        <span>{DEMO_FOOTER_LABEL}</span>
      </div>
    </footer>
  );
}

