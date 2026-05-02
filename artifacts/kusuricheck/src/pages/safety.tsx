import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Safety() {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 md:px-8">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-destructive/10 rounded-full mb-6 text-destructive">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Safety & Limitations</h1>
        <p className="text-lg text-muted-foreground">
          Please read this carefully before using KusuriCheck.
        </p>
      </div>

      <Alert variant="destructive" className="mb-8 bg-destructive/5 border-destructive/20 text-foreground">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <AlertTitle className="text-destructive font-bold">Crucial Disclaimer</AlertTitle>
        <AlertDescription className="mt-2 text-sm leading-relaxed">
          KusuriCheck is an experimental translation and summarization tool. It is <strong>not a medical device</strong>, <strong>not a doctor</strong>, and <strong>not a pharmacist</strong>. It cannot provide medical advice, diagnosis, or treatment recommendations.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              What KusuriCheck Cannot Do
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-destructive mt-0.5">•</span>
                <strong>Recommend doses:</strong> We translate what is on the box. We cannot tell you what dose is right for your specific weight, age, or medical condition.
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-destructive mt-0.5">•</span>
                <strong>Check interactions:</strong> We cannot check if a medicine interacts safely with your existing prescriptions.
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-destructive mt-0.5">•</span>
                <strong>Guarantee accuracy:</strong> Optical Character Recognition (OCR) makes mistakes. Blurry photos, curved bottles, and complex kanji can result in missed warnings or incorrect translation.
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-destructive mt-0.5">•</span>
                <strong>Replace a professional:</strong> If you are pregnant, breastfeeding, elderly, treating a child, or have liver/kidney concerns, you must speak to a pharmacist or doctor.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              How to use this tool safely
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-primary mt-0.5">1.</span>
                <strong>Verify against the physical box:</strong> Always compare the structured summary against the visual layout of the box to ensure major sections weren't missed.
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-primary mt-0.5">2.</span>
                <strong>Use high-quality photos:</strong> Ensure adequate lighting, minimize glare, and hold the camera steady. Flatten curled labels if possible.
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-primary mt-0.5">3.</span>
                <strong>Heed escalation warnings:</strong> If the tool flags a "Pharmacist Consult" or "Doctor Consult", stop and show the physical item to a healthcare professional in Japan. You can use translation apps at the pharmacy counter.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
