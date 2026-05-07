import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanText, BrainCircuit, FileSearch, ShieldCheck, Languages } from "lucide-react";
import { useAppStore } from "@/lib/store";

const CONTENT = {
  en: {
    title: "How KusuriCheck Works",
    subtitle: "A transparent, 5-stage pipeline designed for safety and accuracy.",
    privacyTitle: "Privacy & Data Handling",
    privacyDesc: "KusuriCheck requires no account. We process your image in memory to generate the analysis and return it to you. We do not store your photos, OCR results, or analysis history in any database. The app is completely stateless.",
    steps: [
      {
        title: "1. Optical Character Recognition (OCR)",
        description: "We extract raw text from your image using advanced vision models tailored for complex Japanese packaging layouts and medical Kanji."
      },
      {
        title: "2. Classification",
        description: "The text is analyzed to determine if it's an OTC medicine, a supplement, or a pharmacy instruction sheet. This sets the context for extraction."
      },
      {
        title: "3. Parsing & Entity Extraction",
        description: "Key entities like intended use, dosage, active ingredients, and specific warnings are pulled into a structured format."
      },
      {
        title: "4. Safety Rule Engine",
        description: "A deterministic rules engine checks the extracted data against your caution profile (e.g., child use, pregnancy) to generate necessary escalation flags."
      },
      {
        title: "5. Bilingual Explanation",
        description: "A large language model generates a calm, non-diagnostic summary in both English and Japanese based solely on the structured data."
      }
    ]
  },
  ja: {
    title: "KusuriCheckの仕組み",
    subtitle: "安全性と正確性のために設計された、透明性の高い5段階のパイプライン。",
    privacyTitle: "プライバシーとデータ取り扱い",
    privacyDesc: "KusuriCheckはアカウント登録不要です。分析を生成するためにメモリ内で画像を処理し、結果を返します。写真、OCR結果、または分析履歴をデータベースに保存することはありません。アプリは完全にステートレスです。",
    steps: [
      {
        title: "1. 光学的文字認識 (OCR)",
        description: "複雑な日本のパッケージレイアウトや医療用漢字に特化した高度なビジョンモデルを使用して、画像から生のテキストを抽出します。"
      },
      {
        title: "2. 分類",
        description: "テキストを分析し、それが市販薬、サプリメント、または薬局の説明書であるかを判断します。これにより抽出のコンテキストが決まります。"
      },
      {
        title: "3. パースとエンティティ抽出",
        description: "使用目的、用量、有効成分、特定の警告などの主要な項目を構造化された形式で抽出します。"
      },
      {
        title: "4. 安全ルールエンジン",
        description: "抽出されたデータを、お客様の注意プロファイル（例：子供の使用、妊娠など）と照合し、必要な報告フラグを生成します。"
      },
      {
        title: "5. バイリンガル解説",
        description: "大規模言語モデルが、構造化されたデータのみに基づいて、日英両方の言語で冷静かつ非診断的な要約を生成します。"
      }
    ]
  }
};

export default function HowItWorks() {
  const { uiLanguage } = useAppStore();
  const t = CONTENT[uiLanguage];

  const stepIcons = [
    <ScanText className="h-6 w-6" />,
    <FileSearch className="h-6 w-6" />,
    <BrainCircuit className="h-6 w-6" />,
    <ShieldCheck className="h-6 w-6" />,
    <Languages className="h-6 w-6" />
  ];

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 md:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">{t.title}</h1>
        <p className="text-lg text-muted-foreground">
          {t.subtitle}
        </p>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {t.steps.map((step, index) => (
          <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative">
              {stepIcons[index]}
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
        <h3 className="font-semibold text-foreground mb-2">{t.privacyTitle}</h3>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {t.privacyDesc}
        </p>
      </div>
    </div>
  );
}
