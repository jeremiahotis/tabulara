export const story15RedPhaseData = {
  runExtraction: {
    commandType: 'RunExtraction',
    extractionProfile: 'operations-default',
    sourceState: 'preprocess-ready',
  },
};

export const story15ExpectedErrorCodes = {
  extractionFailed: 'EXTRACTION_FAILED',
  extractionFailureReason: 'extractor_runtime_error',
  extractionRollbackReason: 'transaction_rolled_back',
};
