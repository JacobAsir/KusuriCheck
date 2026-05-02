import { Link, useLocation } from "wouter";
import { Pill, Globe } from "lucide-react";
import { useAppContext } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useHealthCheck } from "@workspace/api-client-react";

export function Navbar() {
  const { uiLanguage, setUiLanguage } = useAppContext();
  const [location] = useLocation();

  const toggleLanguage = () => {
    setUiLanguage(uiLanguage === 'en' ? 'ja' : 'en');
  };

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
              Scan
            </Link>
            <Link href="/how" className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${location === '/how' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
              How it works
            </Link>
            <Link href="/safety" className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${location === '/safety' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
              Safety
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
            <span className="uppercase text-xs font-semibold">{uiLanguage}</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  const { data: health } = useHealthCheck();

  return (
    <footer className="border-t border-border/40 bg-background/50 mt-auto py-8">
      <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            KusuriCheck
          </p>
          <p className="text-xs text-muted-foreground max-w-md">
            This tool provides translations and structural summaries of Japanese medicine labels. 
            <strong className="font-semibold text-foreground ml-1">It is not a doctor or pharmacist. Never use this as medical advice.</strong>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/safety" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Safety & Limitations
          </Link>
          <Link href="/how" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            How it works
          </Link>
          
          {health && (
            <div 
              className="px-2 py-1 rounded-full bg-secondary/50 border border-border text-[10px] font-medium text-muted-foreground uppercase tracking-wider ml-4"
              title={`API Version: ${health.version}`}
              data-testid={`status-mode-${health.processing_mode}`}
            >
              Mode: {health.processing_mode}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col w-full relative selection:bg-primary/20">
      <Navbar />
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
