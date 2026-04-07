export const STUDENT_RESUME_ACCEPT = '.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';
export const MAX_STUDENT_RESUME_BYTES = 5 * 1024 * 1024;

const readFile = (file, readerMethod) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Unable to read file.'));
  reader[readerMethod](file);
});

export const readFileAsDataUrl = (file) => readFile(file, 'readAsDataURL');
export const readFileAsText = (file) => readFile(file, 'readAsText');

export const validateStudentResumeFile = (file) => {
  if (!file) return 'Select a resume file first.';
  if (!/\.(pdf|doc|docx|txt)$/i.test(String(file.name || ''))) {
    return 'Resume must be PDF, DOC, DOCX, or TXT.';
  }
  if (Number(file.size || 0) > MAX_STUDENT_RESUME_BYTES) {
    return 'Resume file must be 5 MB or smaller.';
  }
  return '';
};

export const readResumeImportPayload = async (file) => (
  file.type === 'text/plain' || /\.txt$/i.test(String(file.name || ''))
    ? { resumeText: await readFileAsText(file), resumeUrl: '' }
    : { resumeText: '', resumeUrl: await readFileAsDataUrl(file) }
);

export const mergeStudentProfileDraft = (current = {}, draft = {}) => {
  const merged = { ...(current || {}) };

  Object.entries(draft || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length > 0) merged[key] = value;
      return;
    }

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      merged[key] = value;
    }
  });

  return merged;
};

export const applyImportedResumeToProfile = ({
  currentProfile = {},
  importedDraft = {},
  uploadSummary = {},
  fallbackResumeText = ''
} = {}) => {
  const merged = mergeStudentProfileDraft(currentProfile, importedDraft);

  return {
    ...merged,
    resumeUrl: uploadSummary.resumeUrl || merged.resumeUrl || '',
    resumeText: uploadSummary.resumeText || merged.resumeText || fallbackResumeText || ''
  };
};

export const summarizeImportedProfileDraft = (profile = {}) => {
  const technicalCount = Array.isArray(profile.technicalSkills) ? profile.technicalSkills.length : 0;
  const experienceCount = Array.isArray(profile.experience) ? profile.experience.length : 0;
  const educationCount = Array.isArray(profile.educationEntries) ? profile.educationEntries.length : 0;

  const parts = [];
  if (technicalCount > 0) parts.push(`${technicalCount} skills`);
  if (experienceCount > 0) parts.push(`${experienceCount} experience items`);
  if (educationCount > 0) parts.push(`${educationCount} education entries`);

  return parts.length > 0 ? parts.join(', ') : 'profile basics';
};
