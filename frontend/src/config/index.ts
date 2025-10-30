export const config = {
  api: {
    baseUrl: 'http://localhost:8000',
    endpoints: {
      recommendations: '/api/v1/getRecommendation'
    }
  }
} as const;

// Helper function to get full API URL
export const getApiUrl = (endpoint: keyof typeof config.api.endpoints): string => {
  return `${config.api.baseUrl}${config.api.endpoints[endpoint]}`;
};