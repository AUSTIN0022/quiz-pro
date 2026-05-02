import { useCallback, useEffect, useState } from 'react';
import { certificateService, type Certificate, type CertificateTemplate } from '@/lib/services/certificate-service';

export function useCertificates(contestId: string) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issuingProgress, setIssuingProgress] = useState(0);

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await certificateService.listCertificates(contestId);

      if (response.success && response.data) {
        setCertificates(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch certificates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await certificateService.getTemplates();

      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (err) {
      console.error('[v0] Failed to fetch templates:', err);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
    fetchTemplates();
  }, [fetchCertificates, fetchTemplates]);

  const issueCertificates = useCallback(
    async (participantIds: string[], templateId: string = 'tmpl-default') => {
      try {
        setIssuingProgress(0);
        const response = await certificateService.issueCertificates(
          contestId,
          participantIds,
          templateId
        );

        if (response.success && response.data) {
          setIssuingProgress(100);
          await fetchCertificates();
        }

        return response;
      } catch (err) {
        console.error('[v0] Certificate issue failed:', err);
        throw err;
      }
    },
    [contestId, fetchCertificates]
  );

  const bulkIssueCertificates = useCallback(
    async (criteria: 'all' | 'topN' | 'passed', options?: { topN?: number }) => {
      try {
        setIssuingProgress(0);
        const response = await certificateService.bulkIssueCertificates(
          contestId,
          criteria,
          options
        );

        if (response.success) {
          setIssuingProgress(100);
          await fetchCertificates();
        }

        return response;
      } catch (err) {
        console.error('[v0] Bulk issue failed:', err);
        throw err;
      }
    },
    [contestId, fetchCertificates]
  );

  const downloadPDF = useCallback(async (certificateId: string) => {
    try {
      const response = await certificateService.downloadCertificatePDF(certificateId);

      if (response.success && response.data) {
        window.open(response.data.url, '_blank');
      }

      return response;
    } catch (err) {
      console.error('[v0] PDF download failed:', err);
      throw err;
    }
  }, []);

  const getCertificatesByParticipant = useCallback(
    async (participantId: string) => {
      try {
        const response = await certificateService.getCertificatesByParticipant(participantId);
        return response.data || [];
      } catch (err) {
        console.error('[v0] Fetch participant certs failed:', err);
        return [];
      }
    },
    []
  );

  return {
    certificates,
    templates,
    loading,
    error,
    issuingProgress,
    fetchCertificates,
    issueCertificates,
    bulkIssueCertificates,
    downloadPDF,
    getCertificatesByParticipant,
    getDefaultTemplate: () => templates.find(t => t.isDefault)
  };
}
