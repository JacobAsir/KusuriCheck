import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, Camera, FileText, ArrowRight, ShieldAlert, Sparkles, BoxSelect } from "lucide-react";
import { useListDemoSamples } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const DOC_TYPES = [
  "OTC Medicine Boxes",
  "Supplement Bottles",
  "Pharmacy Instruction Sheets",
  "Package Inserts",
];

export default function Home() {
  const { data: demoSamples, isLoading } = useListDemoSamples();
  const [docIndex, setDocIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDocIndex((prev) => (prev + 1) % DOC_TYPES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-primary/10 to-background pt-20 pb-16 px-4 md:px-8">
        <div className="container mx-auto max-w-4xl text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border text-sm text-muted-foreground mb-8 shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Japan-first utility AI</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
            Understand Japanese <br />
            medicine labels <span className="text-primary font-serif italic">instantly</span>.
          </h1>
          
          <div className="h-8 mb-8 overflow-hidden relative w-full flex justify-center text-muted-foreground text-lg md:text-xl">
            Read and summarize
            <AnimatePresence mode="wait">
              <motion.span
                key={docIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="font-medium text-foreground ml-2 absolute left-1/2 ml-14 whitespace-nowrap"
              >
                {DOC_TYPES[docIndex]}
              </motion.span>
            </AnimatePresence>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Take a photo of any Japanese over-the-counter medicine, supplement, or pharmacy instruction sheet. Get a careful, bilingual summary with clear usage guidelines and warnings.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
            <Link href="/scan" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8 h-14 shadow-md hover-elevate">
                <Camera className="h-5 w-5" />
                Scan a label
              </Button>
            </Link>
            <Link href="/how" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-base px-8 h-14 bg-background">
                How it works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="w-full py-16 px-4 md:px-8 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BoxSelect className="h-5 w-5 text-primary" />
                Try a demo sample
              </h2>
              <p className="text-muted-foreground mt-1">See how KusuriCheck analyzes different types of documents.</p>
            </div>
            <Link href="/scan">
              <Button variant="ghost" className="hidden sm:flex gap-2">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-32 bg-muted/50 rounded-t-xl" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-full mb-1" />
                    <div className="h-3 bg-muted rounded w-4/5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoSamples?.slice(0, 3).map((sample) => (
                <Link key={sample.id} href={`/scan?demo=${sample.id}`}>
                  <Card className="h-full cursor-pointer hover-elevate transition-all border-border/60 hover:border-primary/30 group">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-secondary text-secondary-foreground uppercase tracking-wider">
                          {sample.content_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {sample.label_en}
                      </CardTitle>
                      <CardDescription className="font-medium text-foreground/70">
                        {sample.label}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {sample.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-6 flex justify-center sm:hidden">
            <Link href="/scan">
              <Button variant="outline" className="gap-2">
                View all demos <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Safety Callout */}
      <section className="w-full py-16 px-4 md:px-8 bg-secondary/30">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center justify-center p-3 bg-secondary rounded-full mb-6 text-primary">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Committed to safety</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            KusuriCheck is a translation and summarization tool. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a physician or pharmacist if you are unsure.
          </p>
          <Link href="/safety">
            <Button variant="outline" className="bg-background gap-2">
              Read our safety guidelines
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
