import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Upload, FileImage, FileText, AlertCircle, Loader2,
  Settings2, UserCircle, Activity, Baby, HeartPulse, Sparkles,
  Plus, History, Trash2, Info, AlertTriangle, ShieldAlert, CheckCircle2,
  Search, Pill, Globe, ChevronRight, X, Beaker
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Menu, HelpCircle } from "lucide-react";

import { useAnalyzeFile, DEFAULT_PREFERENCES, type UserPreferences } from "@/lib/analyzeClient";
import { useAppStore, type HistoryItem } from "@/lib/store";

// Mapped styling for escalation levels (copied from result.tsx)
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
    title: "Safety Escalation"
  }
};

const CONTENT_TYPE_LABELS: Record<string, Record<string, string>> = {
  en: {
    otc: "OTC Medicine",
    supplement: "Supplement",
    instruction_sheet: "Pharmacy Instruction",
    package_insert_fragment: "Package Insert Fragment",
    unclear: "Unclear Document"
  },
  ja: {
    otc: "市販薬",
    supplement: "サプリメント",
    instruction_sheet: "薬局の説明書",
    package_insert_fragment: "添付文書の断片",
    unclear: "不明な書類"
  }
};

const DASH_CONTENT = {
  en: {
    newScan: "New Scan",
    recentScans: "Recent Scans",
    noHistory: "No scan history yet",
    scanDoc: "Scan Document",
    scanSub: "Select preferences and upload a label to analyze.",
    outLang: "Output Language",
    audience: "Audience Mode",
    caution: "Caution Profile (Optional)",
    dragDrop: "Drag & drop your file here",
    fileTypes: "Accepts images or PDFs up to 10MB.",
    browse: "Browse Files",
    change: "Change",
    remove: "Remove",
    analyze: "Analyze",
    analyzing: "Analyzing Document",
    analyzingSub: "Extracting text and applying safety rules...",
    analysisRes: "Analysis Result",
    noActiveRes: "No active result",
    noActiveSub: "Select a previous scan from history or upload a new document to see details here.",
    usage: "Usage & Dosage",
    intended: "Intended Use",
    dosage: "Dosage",
    warnings: "Warnings",
    ingredients: "Ingredients",
    noneIdentified: "None identified",
    conf: "CONFIDENCE",
    unidentified: "Unidentified",
    safetyNotes: "Safety Notes",
    askDoc: "Consult Doctor:",
    askPharm: "Ask Pharmacist:",
    cautionNotice: "Requires caution",
    infoOnly: "Informational only",
    audienceModes: {
      standard: "Standard",
      simple: "Simple",
      caregiver: "Caregiver"
    },
    audienceTip: "Changes the tone of the summary. Standard provides a balanced medical translation. Simple avoids complex medical jargon. Caregiver focuses heavily on safe administration and warnings.",
    cautionTip: "Acts as a personalized safety filter. If the scanned medicine contains a warning matching your selected profile, the app will instantly flag it with a prominent 'Consult Pharmacist/Doctor' alert.",
    camera: "Camera",
    trySample: "Try with a sample"
  },
  ja: {
    newScan: "新規スキャン",
    recentScans: "最近のスキャン",
    noHistory: "スキャン履歴がありません",
    scanDoc: "書類をスキャン",
    scanSub: "設定を選択し、ラベルをアップロードして分析します。",
    outLang: "出力言語",
    audience: "対象者モード",
    caution: "注意プロファイル（任意）",
    dragDrop: "ここにファイルをドラッグ＆ドロップ",
    fileTypes: "10MBまでの画像またはPDFに対応",
    browse: "ファイルを選択",
    change: "変更",
    remove: "削除",
    analyze: "分析する",
    analyzing: "書類を分析中",
    analyzingSub: "テキストを抽出し、安全ルールを適用しています...",
    analysisRes: "分析結果",
    noActiveRes: "結果がありません",
    noActiveSub: "履歴から以前のスキャンを選択するか、新しい書類をアップロードして詳細を確認してください。",
    usage: "使用方法と用量",
    intended: "使用目的",
    dosage: "用量",
    warnings: "警告事項",
    ingredients: "成分",
    noneIdentified: "検出されませんでした",
    conf: "信頼度",
    unidentified: "未特定",
    safetyNotes: "安全上の注意",
    askDoc: "医師に相談:",
    askPharm: "薬剤師に相談:",
    cautionNotice: "注意が必要",
    infoOnly: "情報提供のみ",
    audienceModes: {
      standard: "標準",
      simple: "簡易",
      caregiver: "介護者"
    },
    audienceTip: "要約のトーンを変更します。「標準」はバランスの取れた医療翻訳を提供し、「簡易」は専門用語を避けます。「介護者」は安全な投与と警告に重点を置きます。",
    cautionTip: "個人的な安全フィルターとして機能します。スキャンした薬に選択したプロファイルと一致する警告が含まれている場合、アプリは直ちに「薬剤師/医師に相談」のアラートを強調表示します。",
    camera: "カメラ",
    trySample: "サンプルで試す"
  }
};

export default function Dashboard() {
  const {
    result, setResult,
    history, addToHistory, removeFromHistory, clearHistory,
    uiLanguage, setUiLanguage
  } = useAppStore();

  const t = DASH_CONTENT[uiLanguage];
  const analyzeFile = useAnalyzeFile();

  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"en" | "ja">("en");
  const [isMobileResultOpen, setIsMobileResultOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isPending = analyzeFile.isPending;
  const error = analyzeFile.error;

  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 120;
          const MAX_HEIGHT = 120;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const [thumbnail, setThumbnail] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const processFile = async (selected: File) => {
    if (selected.size > 10 * 1024 * 1024) return;
    setFile(selected);
    if (selected.type.startsWith('image/')) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
      const thumb = await generateThumbnail(selected);
      setThumbnail(thumb);
    } else {
      setPreviewUrl(null);
      setThumbnail(null);
    }
  };

  const loadSample = async (name: string, path: string) => {
    try {
      const response = await fetch(path);
      const blob = await response.blob();
      const sampleFile = new File([blob], name, { type: blob.type });
      processFile(sampleFile);
    } catch (err) {
      console.error("Failed to load sample", err);
    }
  };

  const handleUploadSubmit = () => {
    if (!file) return;

    analyzeFile.mutate(
      { file, preferences },
      {
        onSuccess: (data) => {
          addToHistory(data, file.name, previewUrl || undefined, thumbnail || undefined);
          setResult(data);
          setIsMobileResultOpen(true);
        }
      }
    );
  };

  const updateCautionProfile = (key: keyof typeof preferences.caution_profile, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      caution_profile: { ...prev.caution_profile, [key]: checked }
    }));
  };

  const selectHistoryItem = (item: HistoryItem) => {
    setResult(item.result);
    setPreviewUrl(item.previewUrl || item.thumbnail || null);
    setThumbnail(item.thumbnail || null);
    setFile(null); // Clear active file if selecting from history
    setIsMobileResultOpen(true);
  };

  const startNewScan = () => {
    setResult(null);
    setFile(null);
    setPreviewUrl(null);
    setThumbnail(null);
    setIsMobileResultOpen(false);
  };

  useEffect(() => {
    setPreferences(prev => ({ ...prev, language: uiLanguage }));
  }, [uiLanguage]);

  // Always reset to 'New Scan' state on initial mount
  useEffect(() => {
    setResult(null);
  }, []);

  const historyList = (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <Button onClick={startNewScan} className="h-10 w-full gap-2 rounded-lg text-sm font-bold shadow-sm" variant="default">
          <Plus className="h-4 w-4" /> {t.newScan}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 py-4">
          <div className="mb-3 flex items-center justify-between px-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
            <span>{t.recentScans}</span>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Clear scan history"
                aria-label="Clear scan history"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 opacity-40">
              <div className="bg-muted p-4 rounded-full mb-3">
                <History className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">{t.noHistory}</p>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className={`group grid min-h-[72px] w-full cursor-pointer grid-cols-[56px_minmax(0,1fr)_32px] items-center gap-3 overflow-hidden rounded-xl px-3 py-2 text-left transition-all duration-200
                    ${result?.id === item.result.id
                      ? 'bg-primary/10 shadow-sm ring-1 ring-primary/20'
                      : 'hover:bg-background/70 hover:shadow-sm'}
                  `}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectHistoryItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectHistoryItem(item);
                    }
                  }}
                >
                  <div className="h-14 w-14 overflow-hidden rounded-md border border-border/60 bg-background shadow-xs shrink-0">
                    {(item.thumbnail || item.previewUrl) ? (
                      <img
                        src={item.thumbnail || item.previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <FileText className="h-full w-full p-3 text-muted-foreground/45" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-5 text-foreground">
                      {item.result.product_name || item.fileName}
                    </p>
                    <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] leading-4 text-muted-foreground">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${item.result.escalation_level > 1 ? 'bg-orange-500' : 'bg-blue-500'}`} />
                      <p className="truncate">
                        {item.result.escalation_level > 0 ? (item.result.escalation_level > 1 ? 'Caution' : 'Consult') : 'Info'} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFromHistory(item.id); }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground opacity-60 transition-all hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 group-focus-visible:opacity-100"
                    title="Delete scan"
                    aria-label="Delete scan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const sectionsToDisplay = result ? ((activeTab === "en" ? result.sections_en : result.sections_ja) || result.sections) : null;

  const resultContent = result && sectionsToDisplay ? (
    <div className="p-6 space-y-6 pb-24">
      {/* Status Banner */}
      {(() => {
        const escLevel = Math.min(Math.max(result.escalation_level, 0), 3) as 0 | 1 | 2 | 3;
        const style = ESCALATION_STYLES[escLevel];
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl border p-4 flex gap-3 ${style.bg} ${style.border}`}
          >
            <div className="shrink-0 mt-0.5">{style.icon}</div>
            <div className="flex-1">
              <h4 className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>{style.title}</h4>
              <p className={`text-xs mt-1 font-semibold ${style.text}`}>
                {escLevel === 0 ? t.infoOnly : t.cautionNotice}
              </p>
            </div>
          </motion.div>
        );
      })()}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-background/50">
            {CONTENT_TYPE_LABELS[uiLanguage][result.content_type] || result.content_type}
          </Badge>
          <span className="text-[10px] font-bold text-muted-foreground">
            {t.conf}: {Math.round(result.confidence_score * 100)}%
          </span>
        </div>

        <h3 className="text-xl font-bold leading-tight">
          {activeTab === "en" ? (result.product_name_en || result.product_name || t.unidentified) : (result.product_name || t.unidentified)}
        </h3>

        <div className="text-sm leading-relaxed text-foreground/80 bg-background/40 p-4 rounded-xl border border-border/40">
          {activeTab === "en" ? result.summary_en : result.summary_ja}
        </div>
      </div>

      {/* Consult Flags */}
      {result.consult_flags.length > 0 && (
        <div className="space-y-3">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.safetyNotes}</Label>
          <div className="space-y-2">
            {result.consult_flags.map((flag, i) => (
              <div key={i} className={`p-3 rounded-lg border text-xs flex gap-2 ${flag.type === 'doctor' ? 'bg-destructive/5 border-destructive/10 text-destructive' : 'bg-orange-500/5 border-orange-500/10 text-orange-600'}`}>
                <div className="shrink-0 mt-0.5">
                  {flag.type === 'doctor' ? <ShieldAlert className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                </div>
                <p><strong>{flag.type === 'doctor' ? t.askDoc : t.askPharm}</strong> {flag.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sections Accordion */}
      <Accordion type="multiple" defaultValue={["usage"]} className="space-y-3">
        <AccordionItem value="usage" className="border rounded-xl bg-background shadow-sm overflow-hidden border-border/60">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><Pill className="h-3.5 w-3.5" /> {t.usage}</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-0 space-y-4">
            <Separator className="opacity-50" />
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.intended}</p>
              <p className="text-xs">{sectionsToDisplay.intended_use || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.dosage}</p>
              <p className="text-xs whitespace-pre-wrap">{sectionsToDisplay.dosage || "N/A"}</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="warnings" className="border rounded-xl bg-background shadow-sm overflow-hidden border-border/60">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><AlertTriangle className="h-3.5 w-3.5" /> {t.warnings}</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-0 space-y-4">
            <Separator className="opacity-50" />
            {sectionsToDisplay.warnings.length > 0 ? (
              <ul className="space-y-2">
                {sectionsToDisplay.warnings.map((w, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="text-orange-500">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">{t.noneIdentified}</p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ingredients" className="border rounded-xl bg-background shadow-sm overflow-hidden border-border/60">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><Beaker className="h-3.5 w-3.5" /> {t.ingredients}</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-0 space-y-4">
            <Separator className="opacity-50" />
            <div className="flex flex-wrap gap-1.5">
              {sectionsToDisplay.ingredients.map((ing, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] font-normal px-2 py-0">{ing}</Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ) : (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
      <div className="bg-muted p-6 rounded-full mb-6">
        <Search className="h-12 w-12 text-muted-foreground/30" />
      </div>
      <h3 className="text-base font-semibold mb-2">{t.noActiveRes}</h3>
      <p className="text-xs text-muted-foreground">{t.noActiveSub}</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-background">
      {/* MOBILE HEADER */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-background z-20">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <History className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>{t.recentScans}</SheetTitle>
            </SheetHeader>
            <div className="h-full bg-muted/20">
              {historyList}
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Logo" className="h-6 w-6" onError={(e) => { e.currentTarget.src = "https://img.icons8.com/fluency/48/pill.png"; }} />
          <span className="font-bold text-sm">KusuriCheck</span>
        </div>

        <Sheet open={!!result && isMobileResultOpen} onOpenChange={setIsMobileResultOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!result}>
              <FileText className={`h-5 w-5 ${result ? 'text-primary' : 'text-muted-foreground'}`} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-full sm:max-w-md">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>{t.analysisRes}</SheetTitle>
            </SheetHeader>
            <div className="h-full overflow-auto">
              {resultContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* LEFT SIDEBAR - HISTORY (Desktop) */}
      <aside className="hidden lg:flex w-80 border-r border-border bg-muted/20 flex-col shrink-0">
        {historyList}
      </aside>

      {/* MIDDLE COLUMN - INPUT/SCAN */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden border-r border-border">
        <header className="p-6 border-b border-border/40 bg-muted/5 shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.scanDoc}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.scanSub}</p>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-6 pt-4 space-y-8 max-w-3xl mx-auto">
            <TooltipProvider delayDuration={300}>
              {/* Preferences Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.audience}</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/70 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs p-3">
                        <p className="text-sm font-medium leading-relaxed">{t.audienceTip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex gap-2">
                    {["standard", "simple", "caregiver"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setPreferences(prev => ({ ...prev, audience_mode: m as any }))}
                        className={`flex-1 px-2 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-tight transition-all
                            ${preferences.audience_mode === m
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background border-border hover:bg-muted/50 text-muted-foreground'}
                          `}
                      >
                        {t.audienceModes[m as keyof typeof t.audienceModes]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Caution Profile */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Activity className="h-3 w-3" /> {t.caution}
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground/70 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3">
                      <p className="text-sm font-medium leading-relaxed">{t.cautionTip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'preg', label: uiLanguage === 'en' ? 'Pregnant' : '妊娠中', key: 'pregnant_breastfeeding' },
                  { id: 'child', label: uiLanguage === 'en' ? 'Child' : '子供', key: 'child_use' },
                  { id: 'elderly', label: uiLanguage === 'en' ? 'Elderly' : '高齢者', key: 'elderly' },
                  { id: 'liver', label: uiLanguage === 'en' ? 'Liver' : '肝臓', key: 'liver_concern' },
                  { id: 'kidney', label: uiLanguage === 'en' ? 'Kidney' : '腎臓', key: 'kidney_concern' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => updateCautionProfile(c.key as any, !preferences.caution_profile[c.key as keyof typeof preferences.caution_profile])}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5
                      ${preferences.caution_profile[c.key as keyof typeof preferences.caution_profile]
                        ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
                        : 'bg-background border-border hover:bg-muted/50 text-muted-foreground'}
                    `}
                  >
                    {preferences.caution_profile[c.key as keyof typeof preferences.caution_profile] && <CheckCircle2 className="h-3 w-3" />}
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Area */}
            <div className="space-y-4 pb-12">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm font-bold">Analysis Failed</AlertTitle>
                  <AlertDescription className="text-xs">
                    {error instanceof Error ? error.message : "An unexpected error occurred."}
                  </AlertDescription>
                </Alert>
              )}

              <Card
                className={`border-2 border-dashed border-border/60 transition-all duration-200 overflow-hidden
                  ${isDragging ? 'bg-primary/5 border-primary shadow-inner scale-[0.99]' : 'bg-muted/10 hover:bg-muted/20'}
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const d = e.dataTransfer.files?.[0]; if (d) processFile(d); }}
              >
                <CardContent className="p-0">
                  {previewUrl ? (
                    <div className="relative group">
                      <img 
                        key={previewUrl}
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-auto object-contain max-h-[400px] bg-black/5" 
                        onError={(e) => { 
                          if (thumbnail && e.currentTarget.src !== thumbnail) {
                            e.currentTarget.src = thumbnail;
                          } else {
                            e.currentTarget.style.display = "none";
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                          <Upload className="h-4 w-4" /> {t.change}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => { setFile(null); setPreviewUrl(null); }} className="gap-2">
                          <X className="h-4 w-4" /> {t.remove}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Camera className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-semibold mb-1">{t.dragDrop}</h3>
                      <p className="text-[10px] text-muted-foreground mb-6">{t.fileTypes}</p>

                      <div className="flex gap-3 w-full max-w-xs">
                        <Button size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2 flex-1">
                          <Upload className="h-3.5 w-3.5" /> {t.browse}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => cameraInputRef.current?.click()} className="gap-2 flex-1">
                          <Camera className="h-3.5 w-3.5" /> {t.camera}
                        </Button>
                      </div>

                      <div className="mt-10 pt-8 border-t border-border/40 w-full">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">{t.trySample}</p>
                        <div className="flex gap-6 justify-center">
                          {[
                            { id: 'headache', img: '/samples/headache.png', name: 'Headache' },
                            { id: 'stomach', img: '/samples/stomach.png', name: 'Stomach' }
                          ].map((s) => (
                            <div key={s.id} className="flex flex-col items-center gap-2 group/sample">
                              <button
                                onClick={() => loadSample(`${s.id}.png`, s.img)}
                                className="relative h-20 w-20 rounded-xl overflow-hidden border border-border/60 hover:border-primary/50 transition-all shadow-sm"
                              >
                                <img src={s.img} alt={s.name} className="h-full w-full object-cover group-hover/sample:scale-110 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/sample:opacity-100 transition-opacity flex items-center justify-center">
                                  <Plus className="h-5 w-5 text-white" />
                                </div>
                              </button>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">{s.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                  <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                </CardContent>
                {file && (
                  <CardFooter className="p-4 bg-muted/20 border-t border-border/40 flex justify-between items-center">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-medium truncate">{file.name}</span>
                    </div>
                    <Button size="sm" onClick={handleUploadSubmit} disabled={isPending} className="gap-2 shrink-0 shadow-md">
                      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {t.analyze}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
            </TooltipProvider>
          </div>
        </ScrollArea>
      </main>

      {/* RIGHT SIDEBAR - RESULTS (Desktop) */}
      <aside className="hidden lg:flex w-96 border-l border-border bg-muted/5 flex-col shrink-0 overflow-hidden">
        <header className="p-6 border-b border-border/40 bg-background flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold tracking-tight">{t.analysisRes}</h2>
          {result && (
            <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
              <button
                onClick={() => setActiveTab("en")}
                className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${activeTab === 'en' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
              >EN</button>
              <button
                onClick={() => setActiveTab("ja")}
                className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${activeTab === 'ja' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
              >JP</button>
            </div>
          )}
        </header>

        <ScrollArea className="flex-1">
          {resultContent}
        </ScrollArea>
      </aside>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative mb-8">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t.analyzing}</h2>
            <p className="text-muted-foreground max-w-md">{t.analyzingSub}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
