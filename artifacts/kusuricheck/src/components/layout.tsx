import { Link, useLocation } from "wouter";
import { Pill, Globe } from "lucide-react";
import { useAppContext } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useHealthCheck } from "@workspace/api-client-react";

const NAV_CONTENT = {
  en: {
    scan: "Scan",
    how: "How it works",
    safety: "Safety",
    disclaimer: "This tool provides translations and structural summaries of Japanese medicine labels.",
    disclaimerBold: "It is not a doctor or pharmacist. Never use this as medical advice.",
    safetyLink: "Safety & Limitations",
    howLink: "How it works",
  },
  ja: {
    scan: "スキャン",
    how: "使い方",
    safety: "安全について",
    disclaimer: "このツールは、日本の医薬品ラベルの翻訳と構造化された要約を提供します。",
    disclaimerBold: "これは医師や薬剤師ではありません。医療上のアドバイスとして決して使用しないでください。",
    safetyLink: "安全と制限",
    howLink: "使い方",
  }
};

export function Navbar() {
  const { uiLanguage, setUiLanguage } = useAppContext();
  const [location] = useLocation();
  const t = NAV_CONTENT[uiLanguage];

  const toggleLanguage = () => {
    setUiLanguage(uiLanguage === 'en' ? 'ja' : 'en');
  };

  const isScanPage = location === '/scan';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Pill className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight text-foreground sm:inline-block">
            KusuriCheck
          </span>
        </Link>

        <div className="flex items-center gap-1 md:gap-4">
          <div className="hidden md:flex items-center gap-1 mr-4">
            <Link href="/scan" className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${location === '/scan' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
              {t.scan}
            </Link>
            <Link href="/how" className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${location === '/how' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
              {t.how}
            </Link>
            <Link href="/safety" className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${location === '/safety' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
              {t.safety}
            </Link>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            data-testid="button-lang-toggle"
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase text-xs font-semibold">{uiLanguage === 'en' ? '日本語' : 'English'}</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  const { uiLanguage } = useAppContext();
  const t = NAV_CONTENT[uiLanguage];

  return (
    <footer className="border-t border-border/40 bg-background/50 mt-auto py-8">
      <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            KusuriCheck
          </p>
          <p className="text-xs text-muted-foreground max-w-md">
            {t.disclaimer}
            <strong className="font-semibold text-foreground ml-1">{t.disclaimerBold}</strong>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/safety" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            {t.safetyLink}
          </Link>
          <Link href="/how" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            {t.howLink}
          </Link>
          
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isScanPage = location === '/scan';

  return (
    <div className="min-h-[100dvh] flex flex-col w-full relative selection:bg-primary/20 overflow-hidden">
      <Navbar />
      <main className="flex-1 w-full flex flex-col overflow-hidden">
        {children}
      </main>
      {!isScanPage && <Footer />}
    </div>
  );
}
