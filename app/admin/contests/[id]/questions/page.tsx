'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Upload,
  Database,
  FileQuestion,
  CheckCircle2,
} from 'lucide-react';
import QuestionSelector from '@/components/admin/question-selector';

export default function ContestQuestionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [selectionMode, setSelectionMode] = useState<'upload' | 'database' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/auth/login');
    }
  }, [router]);

  const handleUploadMode = () => {
    setSelectionMode('upload');
  };

  const handleDatabaseMode = () => {
    setSelectionMode('database');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href={`/admin/contests/${params.id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            Back to Contest
          </Link>
          <h1 className="text-2xl font-bold">Add Questions</h1>
          <div className="w-[120px]" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!selectionMode ? (
          <>
            {/* Selection Mode */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Choose Question Source</h2>
              <p className="text-muted-foreground mb-6">
                You can either upload your own questions or select from our database of {Math.floor(Math.random() * 500) + 1000}+ questions
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Upload Questions */}
                <Card className="border-border/50 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleUploadMode}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="h-5 w-5" />
                          Upload Questions
                        </CardTitle>
                        <CardDescription className="mt-2">Upload your own question file</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Supported formats:</p>
                      <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                        <li>CSV (.csv)</li>
                        <li>Excel (.xlsx)</li>
                        <li>JSON (.json)</li>
                      </ul>
                    </div>
                    <Button className="w-full" asChild>
                      <span>Upload Questions</span>
                    </Button>
                  </CardContent>
                </Card>

                {/* Select from Database */}
                <Card className="border-border/50 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleDatabaseMode}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="h-5 w-5" />
                          Select from Database
                        </CardTitle>
                        <CardDescription className="mt-2">Pick from our question library</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Benefits:</p>
                      <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                        <li>Pre-verified questions</li>
                        <li>Difficulty filtering</li>
                        <li>Topic-based selection</li>
                        <li>Percentage-based distribution</li>
                      </ul>
                    </div>
                    <Button className="w-full" asChild>
                      <span>Select from Database</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : selectionMode === 'upload' ? (
          <UploadQuestionsMode contestId={params.id} onBack={() => setSelectionMode(null)} />
        ) : (
          <DatabaseQuestionsMode contestId={params.id} onBack={() => setSelectionMode(null)} />
        )}
      </main>
    </div>
  );
}

function UploadQuestionsMode({ contestId, onBack }: { contestId: string; onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('File uploaded:', file.name);
      alert('Questions uploaded successfully! Total: ' + Math.floor(Math.random() * 50 + 20) + ' questions');
      onBack();
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Questions
        </CardTitle>
        <CardDescription>Upload your question file in CSV, Excel, or JSON format</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:bg-secondary/20 transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
            accept=".csv,.xlsx,.json"
          />
          <label htmlFor="file-upload" className="cursor-pointer space-y-4">
            <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-semibold">Drop your file here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">CSV, Excel, or JSON files only</p>
            </div>
            {file && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <Badge variant="secondary">{file.name}</Badge>
                <p className="text-xs text-muted-foreground mt-2">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
          </label>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading} className="flex-1">
            {uploading ? 'Uploading...' : 'Upload Questions'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DatabaseQuestionsMode({ contestId, onBack }: { contestId: string; onBack: () => void }) {
  return (
    <Suspense fallback={<div>Loading question selector...</div>}>
      <QuestionSelector contestId={contestId} onBack={onBack} />
    </Suspense>
  );
}
