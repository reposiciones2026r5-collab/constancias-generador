import adminConfigData from '@/config/adminConfig.json';

export interface AdminConfig {
  modality: 'Seminario' | 'Conversatorio';
  typeNumber: number;
  topic: string;
  certType: string;
  stateCode: string;
  eventDate: string;
}

export const defaultConfig: AdminConfig = {
  modality: 'Seminario',
  typeNumber: 1,
  topic: 'Fertilizantes para el Bienestar y Nutrición Vegetal',
  certType: 'S1',
  stateCode: 'CDMX',
  eventDate: '22 de Septiembre de 2026',
};

// Almacenamiento en memoria para actualizaciones dinámicas en tiempo de ejecución (Edge/Cloudflare)
let inMemoryConfig: AdminConfig | null = null;

export function computeCertType(modality: string, typeNumber: number | string): string {
  const modClean = String(modality).toLowerCase().includes('conversatorio') ? 'C' : 'S';
  const numClean = Math.max(1, parseInt(String(typeNumber), 10) || 1);
  return `${modClean}${numClean}`;
}

export function getAdminConfig(): AdminConfig {
  if (inMemoryConfig) {
    return inMemoryConfig;
  }

  try {
    // 1. Soporte para variables de entorno prioritarias (útil en Cloudflare Pages / Vercel Edge)
    const envModality = process.env.ADMIN_MODALITY || process.env.NEXT_PUBLIC_ADMIN_MODALITY;
    const envTypeNumber = process.env.ADMIN_TYPE_NUMBER || process.env.NEXT_PUBLIC_ADMIN_TYPE_NUMBER;
    const envTopic = process.env.ADMIN_TOPIC || process.env.NEXT_PUBLIC_ADMIN_TOPIC;
    const envStateCode = process.env.ADMIN_STATE_CODE || process.env.NEXT_PUBLIC_ADMIN_STATE_CODE;
    const envEventDate = process.env.ADMIN_EVENT_DATE || process.env.NEXT_PUBLIC_ADMIN_EVENT_DATE;

    const parsed = adminConfigData || defaultConfig;
    
    const rawModality = envModality || parsed.modality;
    const modality: 'Seminario' | 'Conversatorio' = 
      String(rawModality).toLowerCase().includes('conversatorio') ? 'Conversatorio' : 'Seminario';
      
    const rawTypeNumber = envTypeNumber !== undefined ? envTypeNumber : parsed.typeNumber;
    const typeNumber = Math.max(1, parseInt(String(rawTypeNumber), 10) || 1);
    const certType = computeCertType(modality, typeNumber);
    
    const topic = envTopic || (parsed.topic && String(parsed.topic).trim() !== '' ? String(parsed.topic).trim() : defaultConfig.topic);
    const stateCode = (envStateCode || parsed.stateCode || defaultConfig.stateCode).toUpperCase().trim();
    const eventDate = envEventDate || parsed.eventDate || defaultConfig.eventDate;

    return {
      modality,
      typeNumber,
      topic,
      certType,
      stateCode,
      eventDate,
    };
  } catch (error) {
    console.error('Error al obtener la configuración de administración:', error);
  }
  return defaultConfig;
}

export function saveAdminConfig(newConfig: Partial<AdminConfig>): AdminConfig {
  const current = getAdminConfig();
  
  const modality: 'Seminario' | 'Conversatorio' = newConfig.modality
    ? (String(newConfig.modality).toLowerCase().includes('conversatorio') ? 'Conversatorio' : 'Seminario')
    : current.modality;
    
  const typeNumber = newConfig.typeNumber !== undefined
    ? Math.max(1, parseInt(String(newConfig.typeNumber), 10) || 1)
    : current.typeNumber;

  const certType = computeCertType(modality, typeNumber);

  const topic = newConfig.topic !== undefined && String(newConfig.topic).trim() !== ''
    ? String(newConfig.topic).trim()
    : current.topic;

  const updated: AdminConfig = {
    modality,
    typeNumber,
    topic,
    certType,
    stateCode: newConfig.stateCode !== undefined ? String(newConfig.stateCode).trim().toUpperCase() : current.stateCode,
    eventDate: newConfig.eventDate !== undefined ? String(newConfig.eventDate).trim() : current.eventDate,
  };

  inMemoryConfig = updated;
  return updated;
}
