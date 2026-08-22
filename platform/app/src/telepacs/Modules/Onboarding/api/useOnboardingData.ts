import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  getCurrentAccountQueryKey,
  getDoctorCredentialDocumentsListQueryKey,
  getDoctorOnboardingStatusQueryKey,
  getDoctorProfileGetQueryKey,
  useDoctorCredentialDocumentDelete,
  useDoctorCredentialDocumentsList,
  useDoctorCredentialDocumentUpload,
  useDoctorOnboardingStatus,
  useDoctorProfileGet,
  useDoctorProfileSubmit,
  useDoctorProfileUpdate,
} from '../../../api/generated/me/me';
import type {
  DoctorCredentialDocumentUploadRequest,
  DoctorProfile,
  PatchedDoctorProfileRequest,
} from '../../../api/generated/model';
import { errorMessage } from '../../../lib/http/errors';

export function useOnboardingData() {
  const queryClient = useQueryClient();
  const onboarding = useDoctorOnboardingStatus();
  const profile = useDoctorProfileGet();
  const documents = useDoctorCredentialDocumentsList();
  const profileUpdate = useDoctorProfileUpdate();
  const documentUpload = useDoctorCredentialDocumentUpload();
  const documentDelete = useDoctorCredentialDocumentDelete();
  const profileSubmit = useDoctorProfileSubmit();

  const reload = useCallback(
    async () => {
      await Promise.all([onboarding.refetch(), profile.refetch(), documents.refetch()]);
    },
    [documents, onboarding, profile]
  );

  const invalidateOnboarding = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getCurrentAccountQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getDoctorOnboardingStatusQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getDoctorProfileGetQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getDoctorCredentialDocumentsListQueryKey() }),
    ]);
  }, [queryClient]);

  const updateProfile = useCallback(
    async (data: PatchedDoctorProfileRequest) => {
      const result = await profileUpdate.mutateAsync({ data });
      queryClient.setQueryData(getDoctorProfileGetQueryKey(), result);
      await invalidateOnboarding();
      return result;
    },
    [invalidateOnboarding, profileUpdate, queryClient]
  );

  const uploadDocument = useCallback(
    async (data: DoctorCredentialDocumentUploadRequest) => {
      const result = await documentUpload.mutateAsync({ data });
      await invalidateOnboarding();
      return result;
    },
    [documentUpload, invalidateOnboarding]
  );

  const deleteDocument = useCallback(
    async (documentId: string) => {
      await documentDelete.mutateAsync({ documentId });
      await invalidateOnboarding();
    },
    [documentDelete, invalidateOnboarding]
  );

  const submitProfile = useCallback(async () => {
    const result = await profileSubmit.mutateAsync();
    await invalidateOnboarding();
    return result;
  }, [invalidateOnboarding, profileSubmit]);

  const setProfile = useCallback(
    (value: DoctorProfile) => queryClient.setQueryData(getDoctorProfileGetQueryKey(), value),
    [queryClient]
  );

  const firstError = onboarding.error || profile.error || documents.error;
  return {
    snapshot: onboarding.data || null,
    profile: profile.data || null,
    documents: documents.data || [],
    loading: onboarding.isLoading || profile.isLoading || documents.isLoading,
    error: firstError ? errorMessage(firstError) : '',
    reload,
    setProfile,
    updateProfile,
    uploadDocument,
    deleteDocument,
    submitProfile,
    mutationBusy:
      profileUpdate.isPending ||
      documentUpload.isPending ||
      documentDelete.isPending ||
      profileSubmit.isPending,
  };
}
