import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanText, BrainCircuit, FileSearch, ShieldCheck, Languages } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <ScanText className="h-6 w-6" />,
      title: "1. Optical Character Recognition (OCR)",
      description: "We extract raw text from your image using advanced vision models tailored for complex Japanese packaging layouts and medical Kanji."
    },
    {
      icon: <FileSearch className="h-6 w-6" />,
      title: "2. Classification",
      description: "The text is analyzed to determine if it's an OTC medicine, a supplement, or a pharmacy instruction sheet. This sets the context for extraction."
    },
    {
      icon: <BrainCircuit className="h-6 w-6" />,
      title: "3. Parsing & Entity Extraction",
      description: "Key entities like intended use, dosage, active ingredients, and specific warnings are pulled into a structured format."
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "4. Safety Rule Engine",
      description: "A deterministic rules engine checks the extracted data against your caution profile (e.g., child use, pregnancy) to generate necessary escalation flags."
    },
    {
      icon: <Languages className="h-6 w-6" />,
      title: "5. Bilingual Explanation",
      description: "A large language model generates a calm, non-diagnostic summary in both English and Japanese based solely on the structured data."
    }
  ];

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 md:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">How KusuriCheck Works</h1>
        <p className="text-lg text-muted-foreground">
          A transparent, 5-stage pipeline designed for safety and accuracy.
        </p>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {steps.map((step, index) => (
          <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative">
              {step.icon}
            </div>
            <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] hover-elevate border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {step.description}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-muted/30 p-6 rounded-xl border border-border/50 text-center">
        <h3 className="font-semibold text-foreground mb-2">Privacy & Data Handling</h3>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          KusuriCheck requires no account. We process your image in memory to generate the analysis and return it to you. We do not store your photos, OCR results, or analysis history in any database. The app is completely stateless.
        </p>
      </div>
    </div>
  );
}
