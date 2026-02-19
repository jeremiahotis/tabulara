export const story14RedPhaseData = {
  applyPreprocessing: {
    commandType: 'ApplyPreprocessing',
    preprocessingProfile: 'ocr-enhance',
    samplePageIds: ['page-1', 'page-2'],
  },
  reprocessDocument: {
    commandType: 'ReprocessDocument',
    allowedTargetState: 'reprocessed',
    disallowedTargetState: 'archived',
  },
};

export const story14ExpectedErrorCodes = {
  preconditionFailed: 'PRECONDITION_FAILED',
  transitionNotAllowed: 'transition_not_allowed',
  documentNotFound: 'document_not_found',
};
