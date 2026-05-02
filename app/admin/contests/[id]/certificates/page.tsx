'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Download, Send, Loader2, CheckCircle2, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useCertificates } from '@/lib/hooks/useCertificates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

export default function CertificatesPage() {
  const params = useParams();
  const contestId = params.id as string;
  const [issuingCriteria, setIssuingCriteria] = useState<'topN' | 'passed' | 'all'>('topN');
  const [topNValue, setTopNValue] = useState('10');
  const [issuingLoading, setIssuingLoading] = useState(false);

  const {
    certificates,
    templates,
    loading,
    issuingProgress,
    bulkIssueCertificates,
    downloadPDF
  } = useCertificates(contestId);

  const defaultTemplate = templates.find(t => t.isDefault);
  const issued = certificates.filter(c => c.status === 'issued').length;

  const handleIssueCertificates = useCallback(async () => {
    try {
      setIssuingLoading(true);

      const options = issuingCriteria === 'topN' ? { topN: parseInt(topNValue) } : undefined;

      const response = await bulkIssueCertificates(issuingCriteria, options);

      if (response.success) {
        toast.success(`${response.data?.issued || 0} certificates issued successfully`);
      } else {
        toast.error(response.error || 'Failed to issue certificates');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIssuingLoading(false);
    }
  }, [issuingCriteria, topNValue, bulkIssueCertificates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Certificates</h1>
        <p className="text-muted-foreground">Manage and issue certificates to participants</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{issued}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{templates.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {certificates.filter(c => c.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Issuing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Issue Certificates</CardTitle>
          <CardDescription>Generate and issue certificates to participants</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          {defaultTemplate && (
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{defaultTemplate.name}</p>
                  <p className="text-sm text-muted-foreground">{defaultTemplate.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Issue Criteria */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Issue Certificates To</Label>
            <RadioGroup value={issuingCriteria} onValueChange={(val) => setIssuingCriteria(val as any)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="topN" id="topn" />
                  <Label htmlFor="topn" className="cursor-pointer flex-1 font-normal">
                    <div>
                      <p className="font-medium">Top N Participants</p>
                      <p className="text-sm text-muted-foreground">Issue to best performers</p>
                    </div>
                  </Label>
                </div>

                {issuingCriteria === 'topN' && (
                  <div className="ml-8 flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={topNValue}
                      onChange={(e) => setTopNValue(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">participants</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="passed" id="passed" />
                  <Label htmlFor="passed" className="cursor-pointer flex-1 font-normal">
                    <div>
                      <p className="font-medium">All Passed Participants</p>
                      <p className="text-sm text-muted-foreground">Issue to those who passed the quiz</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="cursor-pointer flex-1 font-normal">
                    <div>
                      <p className="font-medium">All Participants</p>
                      <p className="text-sm text-muted-foreground">Issue to every participant</p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Progress */}
          {issuingProgress > 0 && issuingProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Issuing certificates...</span>
                <span className="font-medium">{issuingProgress}%</span>
              </div>
              <Progress value={issuingProgress} />
            </div>
          )}

          {/* Action Buttons */}
          <Button
            onClick={handleIssueCertificates}
            disabled={issuingLoading}
            className="w-full"
          >
            {issuingLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Issue Certificates
          </Button>
        </CardContent>
      </Card>

      {/* Certificates List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Issued Certificates</CardTitle>
          <CardDescription>Manage issued certificates</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map(cert => (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium">{cert.participantName}</TableCell>
                  <TableCell className="text-sm">{templates.find(t => t.id === cert.templateId)?.name}</TableCell>
                  <TableCell>
                    <Badge variant={cert.status === 'issued' ? 'default' : 'secondary'}>
                      {cert.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(cert.issuedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadPDF(cert.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {certificates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No certificates issued yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
