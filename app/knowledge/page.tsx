"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import Button from "@/components/Button";
import StepIndicator from "@/components/StepIndicator";
import { useRouter } from "next/navigation";

export default function KnowledgePage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Choose a file first");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("/api/knowledge/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        return;
      }
      setUploadSuccess(`${selectedFile.name} uploaded`);
      setSelectedFile(null);
    } catch {
      setUploadError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <StepIndicator currentStep={4} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-400">
            Step 4: Knowledge & memory
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-100">
            Knowledge & memory
          </h1>
          <p className="mt-2 text-slate-400">
            Optional: upload docs and we store the last messages for context.
          </p>
        </div>

        {/* Upload documents */}
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-100">
            Upload documents (optional)
          </h2>
          <p className="text-sm text-slate-400">
            Upload manuals, policies, or guides. The AI uses them when answering. PDF and TXT supported.
          </p>
          <div className="rounded-lg border border-dashed border-slate-600 bg-slate-900/50 p-4 space-y-3">
            <input
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="block w-full text-sm text-slate-400 file:mr-3 file:rounded file:border-0 file:bg-primary-500/20 file:px-3 file:py-2 file:text-primary-400"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setSelectedFile(f || null);
                setUploadError(null);
                setUploadSuccess(null);
              }}
            />
            {selectedFile && (
              <p className="text-xs text-slate-400">
                Selected: {selectedFile.name}
              </p>
            )}
            <Button
              type="button"
              variant="secondary"
              disabled={uploading || !selectedFile}
              onClick={handleUpload}
            >
              {uploading ? "Uploading…" : "Upload"}
            </Button>
            {uploadSuccess && (
              <p className="text-xs text-emerald-400">{uploadSuccess}</p>
            )}
            {uploadError && (
              <p className="text-xs text-amber-400">{uploadError}</p>
            )}
          </div>
        </Card>

        {/* Memory — we do it */}
        <Card className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-100">
            Conversation memory
          </h2>
          <p className="text-sm text-slate-400">
            We store the last messages and send them with each request so the AI has context. No setup needed.
          </p>
        </Card>

        {/* Low confidence → forward */}
        <Card className="border-amber-500/30 bg-amber-500/5 space-y-2">
          <h2 className="text-sm font-semibold text-amber-200">
            Low confidence
          </h2>
          <p className="text-sm text-slate-300">
            If the AI isn’t sure, it connects the customer to support instead of guessing.
          </p>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => router.push("/bot-preview")}>
            Back to preview
          </Button>
          <Button variant="primary" onClick={() => router.push("/integration")}>
            Continue to integration
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
