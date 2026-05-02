'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Eye,
  HelpCircle,
  Search,
} from 'lucide-react';

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficulty, setDifficulty] = useState('all');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Mock questions data
    const mockQuestions = [
      {
        id: '1',
        text: 'What is the time complexity of binary search?',
        difficulty: 'easy',
        type: 'mcq',
        contest: 'Java Advanced Programming',
        marks: 1,
      },
      {
        id: '2',
        text: 'Explain the concept of polymorphism in Java',
        difficulty: 'medium',
        type: 'fill',
        contest: 'Java Advanced Programming',
        marks: 2,
      },
      {
        id: '3',
        text: 'Which of the following are correct about inheritance?',
        difficulty: 'medium',
        type: 'msq',
        contest: 'OOPS Fundamentals',
        marks: 2,
      },
      {
        id: '4',
        text: 'True or False: Interfaces can have constructor methods in Java 8+',
        difficulty: 'hard',
        type: 'trueFalse',
        contest: 'Java Advanced Programming',
        marks: 1,
      },
      {
        id: '5',
        text: 'Write a function to find the longest palindromic substring',
        difficulty: 'hard',
        type: 'fill',
        contest: 'Coding Challenge',
        marks: 5,
      },
    ];

    setQuestions(mockQuestions);
    setLoading(false);
  }, [router]);

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficulty === 'all' || q.difficulty === difficulty;
    return matchesSearch && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </Link>
          <h1 className="text-2xl font-bold">Question Bank</h1>
          <Link href="/admin/questions/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Question
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filters */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Questions
            </CardTitle>
            <CardDescription>
              Total: {filteredQuestions.length} questions
            </CardDescription>
          </CardHeader>

          <CardContent>
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No questions found</p>
                <Link href="/admin/questions/new">
                  <Button>Create Your First Question</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-start justify-between p-4 rounded-lg border border-border/50 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="capitalize">
                          {question.type}
                        </Badge>
                        <Badge
                          variant={
                            question.difficulty === 'easy'
                              ? 'secondary'
                              : question.difficulty === 'medium'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {question.difficulty}
                        </Badge>
                        <Badge variant="outline">{question.marks} marks</Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{question.text}</h3>
                      <p className="text-sm text-muted-foreground">{question.contest}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/admin/questions/${question.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/questions/${question.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
