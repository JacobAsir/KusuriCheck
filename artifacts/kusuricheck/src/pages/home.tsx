import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, Camera, FileText, ArrowRight, ShieldAlert, Sparkles, BoxSelect } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

import { useAppStore } from "@/lib/store";

const CONTENT = {
  en: {
    badge: "Japan-first utility AI",
    title: <>Understand Japanese <br /> medicine labels <span className="text-primary font-serif italic">instantly</span>.</>,
    prefix: "Read and summarize",
    docTypes: [
      "OTC Medicine Boxes",
      "Supplement Bottles",
      "Pharmacy Instruction Sheets",
      "Package Inserts",
    ],
    description: "Take a photo of any Japanese over-the-counter medicine, supplement, or pharmacy instruction sheet. Get a careful, bilingual summary with clear usage guidelines and warnings.",
    scanBtn: "Scan a label",
    howBtn: "How it works",
    safetyTitle: "Committed to safety",
    safetyDesc: "KusuriCheck is a translation and summarization tool. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a physician or pharmacist if you are unsure.",
    safetyBtn: "Read our safety guidelines",
  },
  ja: {
    badge: "日本初の実用的なAI",
    title: <>日本の医薬品ラベルを <br /><span className="text-primary font-serif italic">瞬時に</span> 理解する</>,
    prefix: "読み取って要約：",
    docTypes: [
      "市販薬のパッケージ",
      "サプリメントのボトル",
      "お薬の説明書",
      "添付文書",
    ],
    description: "日本の市販薬、サプリメント、または薬局の説明書の写真を撮るだけ。明確な使用ガイドラインと警告を含む、丁寧な日英バイリンガルの要約を取得できます。",
    scanBtn: "ラベルをスキャン",
    howBtn: "使い方",
    safetyTitle: "安全への取り組み",
    safetyDesc: "KusuriCheckは翻訳および要約ツールです。専門的な医療アドバイス、診断、または治療の代わりにはなりません。不明な点がある場合は、必ず医師または薬剤師に相談してください。",
    safetyBtn: "安全ガイドラインを読む",
  }
};

export default function Home() {
  const { uiLanguage } = useAppStore();
  const t = CONTENT[uiLanguage];
  const [docIndex, setDocIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDocIndex((prev) => (prev + 1) % t.docTypes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [t.docTypes.length]);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-primary/10 to-background pt-20 pb-16 px-4 md:px-8">
        <div className="container mx-auto max-w-4xl text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border text-sm text-muted-foreground mb-8 shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>{t.badge}</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
            {t.title}
          </h1>
          
          <div className="h-10 mb-8 grid grid-cols-2 gap-2 text-lg md:text-xl items-center">
            <div className="text-right whitespace-nowrap text-muted-foreground">
              {t.prefix}
            </div>
            <div className="relative h-10 overflow-hidden flex items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${uiLanguage}-${docIndex}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-medium text-foreground whitespace-nowrap"
                >
                  {t.docTypes[docIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            {t.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-md justify-center">
            <Link href="/scan" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8 h-14 shadow-md hover-elevate">
                <Camera className="h-5 w-5" />
                {t.scanBtn}
              </Button>
            </Link>
            <Link href="/how" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-base px-8 h-14 bg-background">
                {t.howBtn}
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
          <h2 className="text-2xl font-bold text-foreground mb-4">{t.safetyTitle}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {t.safetyDesc}
          </p>
          <Link href="/safety">
            <Button variant="outline" className="bg-background gap-2">
              {t.safetyBtn}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
