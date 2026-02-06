// Central API exports
export * from './api/clients';
export { 
  programsApi, 
  fetchPrograms, 
  fetchProgram, 
  createProgram, 
  updateProgram, 
  deleteProgram, 
  duplicateProgram, 
  assignProgram, 
  getTemplates, 
  getClientPrograms,
  ProgramApiError 
} from './api/programs';
export { 
  authApi, 
  tokenUtils, 
  AuthApiError 
} from './api/auth';
export { 
  apiClient, 
  ApiClientError, 
  isApiError, 
  handleApiError 
} from './api/apiClient';