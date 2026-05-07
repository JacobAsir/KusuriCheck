import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, AlertTriangle, ShieldAlert, AlertCircle, Info,
  Pill, FileText, Beaker, CheckCircle2, ChevronRight, ChevronDown, Clock, Search
} from "lucide-react";

import { useAppContext } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Mapped styling for escalation levels
const ESCALATION_STYLES = {
  0: { 
    bg: "bg-blue-50 dark:bg-blue-950/30", 
    border: "border-blue-200 dark:border-blue-900", 
    text: "text-blue-800 dark:text-blue-300", 
    icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    title: "Informational"
  },
  1: { 
    bg: "bg-yellow-50 dark:bg-yellow-950/30", 
    border: "border-yellow-200 dark:border-yellow-900", 
    text: "text-yellow-800 dark:text-yellow-300",
    icon: <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
    title: "Pharmacist Suggestion"
  },
  2: { 
    bg: "bg-orange-50 dark:bg-orange-950/30", 
    border: "border-orange-200 dark:border-orange-900", 
    text: "text-orange-800 dark:text-orange-300",
    icon: <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
    title: "Doctor Suggestion"
  },
  3: { 
    bg: "bg-destructive/10", 
    border: "border-destructive/30", 
    text: "text-destructive",
    icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
    title: "Safety Esculation: Cannot Safely Summarize"
  }
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  otc: "OTC Medicine",
  supplement: "Supplement",
  instruction_sheet: "Pharmacy Instruction",
  package_insert_fragment: "Package Insert Fragment",
  unclear: "Unclear Document"
};

export default function Result() {
  const [, setLocation] = useLocation();
  const { result } = useAppContext();
  const [lang, setLang] = useState<"en" | "ja">("en");
  
  // If no result in store, bounce back to scan
  useEffect(() => {
    if (!result) {
      setLocation("/scan");
    }
  }, [result, setLocation]);

  if (!result) return null;

  const escLevel = Math.min(Math.max(result.escalation_level, 0), 3) as 0|1|2|3;
  const escStyle = ESCALATION_STYLES[escLevel];
  
  const confidencePct = Math.round(result.confidence_score * 100);
  
  // At level 3, we suppress the structured sections to prevent reliance on partial data
  const suppressSections = escLevel === 3;
  const currentSections = (lang === "en" ? result.sections_en : result.sections_ja) || result.sections;

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 md:px-8 pb-24">
      {/* Top Nav & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <Link href="/scan">
          <Button variant="ghost" size="sm" className="gap-2 -ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Scan another
          </Button>
        </Link>
        
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border/50 w-fit">
          <ToggleGroup type="single" value={lang} onValueChange={(v) => v && setLang(v as "en"|"ja")}>
            <ToggleGroupItem value="en" aria-label="English" className="text-xs px-3 py-1 h-7">EN</ToggleGroupItem>
            <ToggleGroupItem value="ja" aria-label="Japanese" className="text-xs px-3 py-1 h-7">日本語</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="space-y-6">
        {/* Escalation Banner - MOVED TO TOP for safety visibility */}
        {escLevel > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border-2 p-5 ${escStyle.bg} ${escStyle.border} shadow-lg`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 scale-125">{escStyle.icon}</div>
              <div className="flex-1">
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${escStyle.text}`}>
                  {escStyle.title}
                </h3>
                <div className="space-y-2 mt-2">
                  {result.consult_flags.map((flag, i) => (
                    <p key={i} className={`text-base font-medium ${escStyle.text}`}>
                      {flag.type === 'doctor' ? '⚠️ Doctor Consult Required:' : '💊 Pharmacist Consult Recommended:'} {flag.reason}
                    </p>
                  ))}
                  {result.warnings.map((warning, i) => (
                    <p key={`w-${i}`} className={`text-sm ${escStyle.text} opacity-90 italic`}>
                      • {warning}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Title Card */}
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <div className="bg-primary/5 px-6 py-4 border-b border-border/40 flex flex-wrap gap-2 items-center justify-between">
            <Badge variant="outline" className="bg-background text-xs font-semibold uppercase tracking-wider">
              {CONTENT_TYPE_LABELS[result.content_type] || result.content_type}
            </Badge>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Search className="h-3 w-3" />
              Confidence: {confidencePct}%
            </div>
          </div>
          <CardHeader className="px-6 py-5">
            <CardTitle className="text-2xl md:text-3xl text-foreground font-bold">
              {(lang === "en" ? result.product_name_en : result.product_name) || result.product_name || "Unidentified Product"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none text-foreground/90">
              <p className="leading-relaxed">
                {lang === "en" ? result.summary_en : result.summary_ja}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Structured Sections (Suppressed on Level 3) */}
        {!suppressSections ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="border-border/60 shadow-sm h-full">
                <CardHeader className="px-6 py-4 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    Usage & Dosage
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Intended Use</h4>
                    <p className="text-sm text-foreground">{currentSections.intended_use || "Not specified"}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Dosage Instructions</h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{currentSections.dosage || "Not specified"}</p>
                  </div>
                  {currentSections.age_notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Age Restrictions</h4>
                        <p className="text-sm text-foreground">{currentSections.age_notes}</p>
                      </div>
                    </>
                  )}
                  {currentSections.storage && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Storage Instructions</h4>
                        <p className="text-sm text-foreground">{currentSections.storage}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-border/60 shadow-sm h-full">
                <CardHeader className="px-6 py-4 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Warnings & Ingredients
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Key Warnings</h4>
                    {currentSections.warnings.length > 0 ? (
                      <ul className="space-y-2">
                        {currentSections.warnings.map((w, i) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                            <span className="text-orange-500 mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">None identified</p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                      <Beaker className="h-3.5 w-3.5" /> Ingredients
                    </h4>
                    {currentSections.ingredients.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {currentSections.ingredients.map((ing, i) => (
                          <Badge key={i} variant="secondary" className="font-normal bg-secondary/50 hover:bg-secondary text-xs">
                            {ing}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not listed or clear</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="border-destructive/20 bg-destructive/5 shadow-sm text-center p-8">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-bold text-destructive mb-2">Structured summary suppressed</h3>
            <p className="text-sm text-foreground/80 max-w-md mx-auto">
              Because this document triggered a high-level safety escalation, we have suppressed the structured dosage and usage sections. Please show the original document to a healthcare professional.
            </p>
          </Card>
        )}

        {/* Evidence & Raw Data Accordion */}
        <Accordion type="single" collapsible className="w-full bg-background rounded-xl border border-border/60 overflow-hidden shadow-sm">
          <AccordionItem value="evidence" className="border-b-0">
            <AccordionTrigger className="px-6 py-4 hover:bg-muted/30 hover:no-underline text-sm font-semibold">
              <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> Extracted Evidence Lines & Raw OCR</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Evidence Mapping</h4>
                  <div className="space-y-2">
                    {result.evidence.map((line, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-3 rounded-lg border bg-muted/20 text-sm">
                        <div className="sm:w-1/3 text-foreground/80 font-medium">
                          {line.japanese_text}
                        </div>
                        <div className="hidden sm:block text-muted-foreground/30">→</div>
                        <div className="sm:w-2/3 flex flex-col gap-1">
                          <span className="text-foreground">{line.normalized_meaning}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{line.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Raw OCR Text</h4>
                  <div className="bg-muted/30 p-4 rounded-lg font-mono text-xs text-muted-foreground whitespace-pre-wrap border border-border/40 max-h-60 overflow-y-auto">
                    {result.raw_ocr_text}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Persistent Disclaimer Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-background/95 backdrop-blur border-t border-border p-3 text-center z-40">
        <p className="text-xs text-muted-foreground max-w-3xl mx-auto flex items-center justify-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span><strong>Not medical advice.</strong> KusuriCheck is a translation tool. Always consult a pharmacist or doctor.</span>
        </p>
      </div>
    </div>
  );
}
