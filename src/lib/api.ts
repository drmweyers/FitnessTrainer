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