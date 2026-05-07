import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";

const CONTENT = {
  en: {
    title: "Safety & Limitations",
    subtitle: "Please read this carefully before using KusuriCheck.",
    disclaimerTitle: "Crucial Disclaimer",
    disclaimerDesc: <>KusuriCheck is an experimental translation and summarization tool. It is <strong>not a medical device</strong>, <strong>not a doctor</strong>, and <strong>not a pharmacist</strong>. It cannot provide medical advice, diagnosis, or treatment recommendations.</>,
    cannotDoTitle: "What KusuriCheck Cannot Do",
    cannotDo: [
      {
        bold: "Recommend doses:",
        text: "We translate what is on the box. We cannot tell you what dose is right for your specific weight, age, or medical condition."
      },
      {
        bold: "Check interactions:",
        text: "We cannot check if a medicine interacts safely with your existing prescriptions."
      },
      {
        bold: "Guarantee accuracy:",
        text: "Optical Character Recognition (OCR) makes mistakes. Blurry photos, curved bottles, and complex kanji can result in missed warnings or incorrect translation."
      },
      {
        bold: "Replace a professional:",
        text: "If you are pregnant, breastfeeding, elderly, treating a child, or have liver/kidney concerns, you must speak to a pharmacist or doctor."
      }
    ],
    howToTitle: "How to use this tool safely",
    howTo: [
      {
        bold: "Verify against the physical box:",
        text: "Always compare the structured summary against the visual layout of the box to ensure major sections weren't missed."
      },
      {
        bold: "Use high-quality photos:",
        text: "Ensure adequate lighting, minimize glare, and hold the camera steady. Flatten curled labels if possible."
      },
      {
        bold: "Heed escalation warnings:",
        text: "If the tool flags a 'Pharmacist Consult' or 'Doctor Consult', stop and show the physical item to a healthcare professional in Japan."
      }
    ]
  },
  ja: {
    title: "安全と制限",
    subtitle: "KusuriCheckを使用する前に、こちらをよくお読みください。",
    disclaimerTitle: "重要な免責事項",
    disclaimerDesc: <>KusuriCheckは実験的な翻訳・要約ツールです。<strong>医療機器ではなく</strong>、<strong>医師でもなく</strong>、<strong>薬剤師でもありません</strong>。医療上のアドバイス、診断、または治療の推奨を提供することはできません。</>,
    cannotDoTitle: "KusuriCheckができないこと",
    cannotDo: [
      {
        bold: "用量の推奨:",
        text: "パッケージに記載されている内容を翻訳します。特定の体重、年齢、または病状に適した用量を指示することはできません。"
      },
      {
        bold: "相互作用の確認:",
        text: "既存の処方薬との安全な飲み合わせを確認することはできません。"
      },
      {
        bold: "正確性の保証:",
        text: "OCR（文字認識）には誤りが発生する可能性があります。写真のぼやけ、ボトルの曲面、複雑な漢字などにより、警告の見落としや誤訳が生じることがあります。"
      },
      {
        bold: "専門家の代わり:",
        text: "妊娠中、授乳中、高齢者、お子様への使用、または肝臓・腎臓に懸念がある場合は、必ず薬剤師または医師に相談してください。"
      }
    ],
    howToTitle: "安全に使用する方法",
    howTo: [
      {
        bold: "実物のパッケージで確認:",
        text: "要約された内容と実物のパッケージのレイアウトを常に比較し、主要な項目が見落とされていないか確認してください。"
      },
      {
        bold: "高品質な写真を使用:",
        text: "十分な照明を確保し、反射を最小限に抑え、カメラを安定させてください。丸まったラベルは可能であれば平らにしてください。"
      },
      {
        bold: "警告に従う:",
        text: "ツールが「薬剤師に相談」または「医師に相談」とフラグを立てた場合は、直ちに使用を控え、実物を日本の医療従事者に提示してください。"
      }
    ]
  }
};

export default function Safety() {
  const { uiLanguage } = useAppStore();
  const t = CONTENT[uiLanguage];

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 md:px-8">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-destructive/10 rounded-full mb-6 text-destructive">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">{t.title}</h1>
        <p className="text-lg text-muted-foreground">
          {t.subtitle}
        </p>
      </div>

      <Alert variant="destructive" className="mb-8 bg-destructive/5 border-destructive/20 text-foreground">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <AlertTitle className="text-destructive font-bold">{t.disclaimerTitle}</AlertTitle>
        <AlertDescription className="mt-2 text-sm leading-relaxed">
          {t.disclaimerDesc}
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              {t.cannotDoTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {t.cannotDo.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-destructive mt-0.5">•</span>
                  <div>
                    <strong>{item.bold}</strong> {item.text}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {t.howToTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {t.howTo.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-primary mt-0.5">{i + 1}.</span>
                  <div>
                    <strong>{item.bold}</strong> {item.text}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
