import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Upload, FileImage, FileText, AlertCircle, Loader2, 
  Settings2, UserCircle, Activity, Baby, HeartPulse, Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useAnalyzeFile, DEFAULT_PREFERENCES, type UserPreferences } from "@/lib/analyzeClient";
import { useAppContext } from "@/lib/store";

export default function Scan() {
  const [, setLocation] = useLocation();
  const { setResult } = useAppContext();
  
  const analyzeFile = useAnalyzeFile();
  
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPending = analyzeFile.isPending;
  const error = analyzeFile.error;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const processFile = (selected: File) => {
    // Validate file type and size (10MB limit)
    if (selected.size > 10 * 1024 * 1024) {
      // Could show a toast here
      return;
    }
    
    setFile(selected);
    
    // Create preview if it's an image
    if (selected.type.startsWith('image/')) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processFile(dropped);
    }
  };

  const handleUploadSubmit = () => {
    if (!file) return;
    
    analyzeFile.mutate(
      { file, preferences },
      {
        onSuccess: (data) => {
          setResult(data);
          setLocation("/result");
        }
      }
    );
  };


  const updateCautionProfile = (key: keyof typeof preferences.caution_profile, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      caution_profile: {
        ...prev.caution_profile,
        [key]: checked
      }
    }));
  };

  if (isPending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background min-h-[60vh]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-primary/10 p-6 rounded-full mb-8"
        >
          <div className="relative">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <Sparkles className="h-6 w-6 text-primary absolute -top-2 -right-2 animate-pulse" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Reading label...</h2>
        <p className="text-muted-foreground max-w-md">
          KusuriCheck is processing the text, identifying the content type, and applying safety rules to generate a careful summary.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Scan Document</h1>
        <p className="text-muted-foreground mt-2">Upload a photo of a label to analyze it with AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive-foreground">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Failed</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "An unexpected error occurred while analyzing the document."}
              </AlertDescription>
            </Alert>
          )}

              <Card className="border-2 border-dashed border-border/60 bg-background/50">
                <CardContent className="p-0">
                  <div 
                    className={`relative flex flex-col items-center justify-center p-12 transition-colors duration-200 min-h-[400px]
                      ${isDragging ? 'bg-primary/5 border-primary' : 'hover:bg-accent/30'}
                      ${file ? 'bg-background' : ''}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileChange}
                      data-testid="input-file"
                    />

                    {file ? (
                      <div className="w-full flex flex-col items-center">
                        {previewUrl ? (
                          <div className="relative w-full max-w-sm rounded-lg overflow-hidden shadow-md mb-6 border border-border">
                            <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-3 left-3 text-white text-sm font-medium truncate pr-3">
                              {file.name}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mb-6 w-full max-w-sm border border-border">
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="overflow-hidden">
                              <p className="font-medium text-sm truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={() => { setFile(null); setPreviewUrl(null); }}>
                            Change File
                          </Button>
                          <Button onClick={handleUploadSubmit} className="gap-2" data-testid="button-submit-upload">
                            <Sparkles className="h-4 w-4" /> Analyze Document
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="mx-auto w-16 h-16 mb-6 rounded-full bg-secondary flex items-center justify-center text-primary">
                          <Camera className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Drag & drop your file here</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                          Accepts images (JPG, PNG, WEBP) or PDF documents up to 10MB.
                        </p>
                        <Button onClick={() => fileInputRef.current?.click()} className="gap-2 hover-elevate">
                          <Upload className="h-4 w-4" /> Browse Files
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
        </div>

        {/* Preferences Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm sticky top-20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Analysis Preferences
              </CardTitle>
              <CardDescription>
                Customize how the results are presented and which safety warnings to emphasize.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" /> Primary Output Language
                </Label>
                <RadioGroup 
                  value={preferences.language} 
                  onValueChange={(v: "ja"|"en") => setPreferences(prev => ({...prev, language: v}))}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="en" id="lang-en" />
                    <Label htmlFor="lang-en" className="flex-1 cursor-pointer">English</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="ja" id="lang-ja" />
                    <Label htmlFor="lang-ja" className="flex-1 cursor-pointer">日本語 (Japanese)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-muted-foreground" /> Audience Mode
                </Label>
                <RadioGroup 
                  value={preferences.audience_mode} 
                  onValueChange={(v: any) => setPreferences(prev => ({...prev, audience_mode: v}))}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="standard" id="mode-std" />
                    <div className="flex-1 cursor-pointer">
                      <Label htmlFor="mode-std" className="cursor-pointer block">Standard</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Clear, direct translation</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="simple" id="mode-simp" />
                    <div className="flex-1 cursor-pointer">
                      <Label htmlFor="mode-simp" className="cursor-pointer block">Simple</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Plain language, no medical jargon</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="caregiver" id="mode-care" />
                    <div className="flex-1 cursor-pointer">
                      <Label htmlFor="mode-care" className="cursor-pointer block">Caregiver</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Focuses on administration & monitoring</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" /> Caution Profile (Optional)
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Enable these to highlight specific warnings if they appear on the label.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cp-preg" className="text-sm cursor-pointer flex items-center gap-2">
                      <Baby className="h-3.5 w-3.5 text-muted-foreground" /> Pregnant / Breastfeeding
                    </Label>
                    <Switch 
                      id="cp-preg" 
                      checked={preferences.caution_profile.pregnant_breastfeeding}
                      onCheckedChange={(c) => updateCautionProfile('pregnant_breastfeeding', c)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cp-child" className="text-sm cursor-pointer flex items-center gap-2">
                      <UserCircle className="h-3.5 w-3.5 text-muted-foreground" /> Child Use
                    </Label>
                    <Switch 
                      id="cp-child" 
                      checked={preferences.caution_profile.child_use}
                      onCheckedChange={(c) => updateCautionProfile('child_use', c)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cp-elderly" className="text-sm cursor-pointer flex items-center gap-2">
                      <UserCircle className="h-3.5 w-3.5 text-muted-foreground" /> Elderly
                    </Label>
                    <Switch 
                      id="cp-elderly" 
                      checked={preferences.caution_profile.elderly}
                      onCheckedChange={(c) => updateCautionProfile('elderly', c)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cp-liver" className="text-sm cursor-pointer flex items-center gap-2">
                      <HeartPulse className="h-3.5 w-3.5 text-muted-foreground" /> Liver Concern
                    </Label>
                    <Switch 
                      id="cp-liver" 
                      checked={preferences.caution_profile.liver_concern}
                      onCheckedChange={(c) => updateCautionProfile('liver_concern', c)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cp-kidney" className="text-sm cursor-pointer flex items-center gap-2">
                      <HeartPulse className="h-3.5 w-3.5 text-muted-foreground" /> Kidney Concern
                    </Label>
                    <Switch 
                      id="cp-kidney" 
                      checked={preferences.caution_profile.kidney_concern}
                      onCheckedChange={(c) => updateCautionProfile('kidney_concern', c)}
                    />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Temporary inline Globe icon since it wasn't imported at the top
function Globe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
