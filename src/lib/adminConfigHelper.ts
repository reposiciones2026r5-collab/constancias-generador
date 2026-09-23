import fs from 'fs';
import path from 'path';

export interface AdminConfig {
  modality: 'Seminario' | 'Conversatorio';
  typeNumber: number;
  topic: string;
  certType: string;
  stateCode: string;
  eventDate: string;
}

const configFilePath = path.join(process.cwd(), 'src', 'config', 'adminConfig.json');

export const defaultConfig: AdminConfig = {
  modality: 'Seminario',
  typeNumber: 1,
  topic: 'Fertilizantes para el Bienestar y Nutrición Vegetal',
  certType: 'S1',
  stateCode: 'CDMX',
  eventDate: '22 de Septiembre de 2026',
};

export function computeCertType(modality: string, typeNumber: number | string): string {
  const modClean = String(modality).toLowerCase().includes('conversatorio') ? 'C' : 'S';
  const numClean = Math.max(1, parseInt(String(typeNumber), 10) || 1);
  return `${modClean}${numClean}`;
}

export function getAdminConfig(): AdminConfig {
  try {
    if (fs.existsSync(configFilePath)) {
      const data = fs.readFileSync(configFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      const modality: 'Seminario' | 'Conversatorio' = 
        String(parsed.modality).toLowerCase().includes('conversatorio') ? 'Conversatorio' : 'Seminario';
      const typeNumber = Math.max(1, parseInt(String(parsed.typeNumber), 10) || 1);
      const certType = computeCertType(modality, typeNumber);
      
      const topic = parsed.topic && String(parsed.topic).trim() !== ''
        ? String(parsed.topic).trim()
        : defaultConfig.topic;

      const stateCode = (parsed.stateCode || defaultConfig.stateCode).toUpperCase().trim();
      const eventDate = parsed.eventDate || defaultConfig.eventDate;

      return {
        modality,
        typeNumber,
        topic,
        certType,
        stateCode,
        eventDate,
      };
    }
  } catch (error) {
    console.error('Error al leer adminConfig.json:', error);
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

  const dir = path.dirname(configFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(configFilePath, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
