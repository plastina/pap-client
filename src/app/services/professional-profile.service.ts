import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProfessionalProfile } from '../models/professional-profile.model';

const STORAGE_KEY = 'saasNutri_professional_v1';

const EMPTY_PROFILE: ProfessionalProfile = {
  name: '',
  title: '',
  crn: '',
  phone: '',
  email: '',
  logo: null,
  palette: 'salvia',
  includeSummary: false,
};

@Injectable({ providedIn: 'root' })
export class ProfessionalProfileService {
  private readonly profileSubject = new BehaviorSubject<ProfessionalProfile>(
    this.load(),
  );
  readonly profile$ = this.profileSubject.asObservable();

  get profile(): ProfessionalProfile {
    return this.profileSubject.value;
  }

  update(changes: Partial<ProfessionalProfile>): void {
    const next = { ...this.profile, ...changes };
    this.profileSubject.next(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Quota exceeded (usually a large logo): keep the in-memory value.
    }
  }

  private load(): ProfessionalProfile {
    if (typeof localStorage === 'undefined') return { ...EMPTY_PROFILE };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...EMPTY_PROFILE, ...JSON.parse(raw) } : { ...EMPTY_PROFILE };
    } catch {
      return { ...EMPTY_PROFILE };
    }
  }
}
