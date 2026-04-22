import api from './api';

export interface DriverLog {
  id: number;
  driverId: number;
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  eventType: string;
  eventTime: string;
  locationLat: number | null;
  locationLng: number | null;
  locationAddress: string | null;
  description: string | null;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  changedBy: string | null;
  oldValues: any;
  newValues: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

class DriverLogService {
  private baseUrl = '/users';

  async getDriverLogs(driverId: number): Promise<DriverLog[]> {
    try {
      const response = await api.get(`${this.baseUrl}/${driverId}/logs`);
      return response.data;
    } catch (error) {
      console.error('Błąd pobierania logów kierowcy:', error);
      return [];
    }
  }

  async getAllDriverLogs(): Promise<DriverLog[]> {
    try {
      const response = await api.get(`${this.baseUrl}/logs/all`);
      return response.data;
    } catch (error) {
      console.error('Błąd pobierania wszystkich logów:', error);
      return [];
    }
  }

  getEventTypeLabel(eventType: string): string {
    const labels: Record<string, string> = {
      'logowanie': '🔐 Logowanie',
      'wylogowanie': '🚪 Wylogowanie',
      'zmiana_statusu': '🟢 Zmiana statusu',
      'przypisanie_pojazdu': '🚗 Przypisanie pojazdu',
      'odpiecie_pojazdu': '🔌 Odpięcie pojazdu',
      'rozpoczęcie_kursu': '🏁 Rozpoczęcie kursu',
      'zakonczenie_kursu': '🏁 Zakończenie kursu',
      'aktualizacja_lokalizacji': '📍 Aktualizacja lokalizacji',
      'edycja_profilu': '✏️ Edycja profilu',
      'zmiana_hasla': '🔑 Zmiana hasła',
      'blokada_konta': '🔒 Blokada konta',
      'odblokowanie_konta': '🔓 Odblokowanie konta'
    };
    return labels[eventType] || eventType;
  }

  getEventTypeColor(eventType: string): string {
    const colors: Record<string, string> = {
      'logowanie': '#27ae60',
      'wylogowanie': '#e74c3c',
      'zmiana_statusu': '#3498db',
      'przypisanie_pojazdu': '#f39c12',
      'odpiecie_pojazdu': '#95a5a6',
      'rozpoczęcie_kursu': '#2ecc71',
      'zakonczenie_kursu': '#e67e22',
      'aktualizacja_lokalizacji': '#1abc9c',
      'edycja_profilu': '#9b59b6',
      'zmiana_hasla': '#34495e',
      'blokada_konta': '#c0392b',
      'odblokowanie_konta': '#27ae60'
    };
    return colors[eventType] || '#7f8c8d';
  }
}

// ✅ WAŻNE: eksportujemy zarówno klasę jak i interfejs
export const driverLogService = new DriverLogService();
export type { DriverLog as DriverLogType };