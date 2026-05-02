'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionForm {
  type: 'mcq' | 'short-answer' | 'essay';
  questionText: string;
  marks: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  options: Option[];
  correctAnswer?: string;
}

export default function CreateQuestionPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<QuestionForm>({
    type: 'mcq',
    questionText: '',
    marks: '1',
    difficulty: 'medium',
    category: 'general',
    options: [
      { id: '1', text: '', isCorrect: true },
      { id: '2', text: '', isCorrect: false },
      { id: '3', text: '', isCorrect: false },
      { id: '4', text: '', isCorrect: false },
    ],
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const parsed = JSON.parse(userData);
    if (parsed.role !== 'admin' && !parsed.email.includes('admin')) {
      router.push('/dashboard');
      return;
    }

    setUser(parsed);
    setLoading(false);
  }, [router]);

  const handleAddOption = () => {
    const newOption: Option = {
      id: Date.now().toString(),
      text: '',
      isCorrect: false,
    };
    setForm({
      ...form,
      options: [...form.options, newOption],
    });
  };

  const handleRemoveOption = (id: string) => {
    if (form.options.length > 2) {
      setForm({
        ...form,
        options: form.options.filter((opt) => opt.id !== id),
      });
    }
  };

  const handleOptionChange = (id: string, text: string) => {
    setForm({
      ...form,
      options: form.options.map((opt) =>
        opt.id === id ? { ...opt, text } : opt
      ),
    });
  };

  const handleCorrectAnswerToggle = (id: string) => {
    setForm({
      ...form,
      options: form.options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === id ? !opt.isCorrect : false,
      })),
    });
  };

  const handleSave = () => {
    const questions = JSON.parse(localStorage.getItem('questions') || '[]');
    questions.push({
      id: Date.now().toString(),
      ...form,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('questions', JSON.stringify(questions));
    setSaved(true);
    setTimeout(() => {
      router.push('/admin/questions');
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/questions" className="flex items-center gap-2 text-primary hover:underline mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Questions
          </Link>
          <h1 className="text-3xl font-bold">Create New Question</h1>
          <p className="text-muted-foreground mt-2">Add a question to your question bank</p>
        </div>
      </div>

      {/* Main Form */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>Fill in all required fields</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Question Type</label>
            <Select value={form.type} onValueChange={(value: any) => setForm({ ...form, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                <SelectItem value="short-answer">Short Answer</SelectItem>
                <SelectItem value="essay">Essay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium mb-2">Question Text</label>
            <textarea
              value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              placeholder="Enter your question here..."
              className="w-full px-3 py-2 border border-border/50 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-24"
            />
          </div>

          {/* Row: Marks, Difficulty, Category */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Marks</label>
              <Input
                type="number"
                min="1"
                value={form.marks}
                onChange={(e) => setForm({ ...form, marks: e.target.value })}
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <Select value={form.difficulty} onValueChange={(value: any) => setForm({ ...form, difficulty: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g., Programming"
              />
            </div>
          </div>

          {/* Options (for MCQ) */}
          {form.type === 'mcq' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Answer Options</h3>
                <Button size="sm" variant="outline" onClick={handleAddOption} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Option
                </Button>
              </div>

              <div className="space-y-3">
                {form.options.map((option, idx) => (
                  <div key={option.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Option {idx + 1}</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={option.isCorrect}
                            onChange={() => handleCorrectAnswerToggle(option.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-xs text-muted-foreground">Correct Answer</span>
                        </label>
                      </div>
                      <Input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                        placeholder="Enter option text..."
                      />
                    </div>
                    {form.options.length > 2 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveOption(option.id)}
                        className="text-destructive hover:text-destructive mt-6"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correct Answer (for Short Answer) */}
          {form.type === 'short-answer' && (
            <div>
              <label className="block text-sm font-medium mb-2">Correct Answer</label>
              <Input
                type="text"
                placeholder="Enter the correct answer"
                className="w-full"
              />
            </div>
          )}

          {/* Save Button */}
          <Button onClick={handleSave} size="lg" className="w-full gap-2">
            {saved ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Question Saved!
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Question
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
