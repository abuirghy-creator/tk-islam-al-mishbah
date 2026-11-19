import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  Teacher,
  Staff,
  Student,
  StudentAttendanceRecord,
  TeacherAttendanceRecord,
  HalaqohAssessment,
  SppInvoice,
  ChatMessage,
  ChatGroup,
  Announcement,
  GalleryItem,
  AppNotification,
  UserRole,
  SchoolProfile,
  HalaqohGroupInfo,
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  StaffPosition,
  STAFF_POSITIONS,
  PublishMeta,
  AppSnapshot,
  AutoSaveStatus,
  RealtimeSyncEvent
} from '../types';
import { SCHOOL_ASSETS } from '../assets/images';
import {
  cleanupBloatedLocalStorage,
  safeJsonParse,
  safeStorageSet,
  safeStorageSetRaw
} from '../utils/storageHelper';
import {
  INITIAL_USERS,
  INITIAL_TEACHERS,
  INITIAL_STAFF,
  INITIAL_STUDENTS,
  INITIAL_HALAQOH_GROUPS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_STUDENT_ATTENDANCE,
  INITIAL_TEACHER_ATTENDANCE,
  INITIAL_HALAQOH_ASSESSMENTS,
  INITIAL_SPP_INVOICES,
  INITIAL_CHAT_GROUPS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_GALLERY,
  INITIAL_NOTIFICATIONS
} from '../data/initialData';

export const INITIAL_SCHOOL_PROFILE: SchoolProfile = {
  name: 'TK ISLAM AL MISHBAH',
  motto: 'Mencetak Generasi Qur\'ani yang Cerdas, Berakhlak Mulia & Mandiri',
  logoUrl: SCHOOL_ASSETS.logo,
  npsn: 'NPSN: 69982314',
  address: 'Jl. Raya Cilebut No. 12, Cilebut - Bogor',
  phone: '(021) 7890-1234 / 0812-9988-7766',
  email: 'info@tk-almishbah.sch.id',
  principalName: 'Hj. Siti Khadijah, M.Pd.I',
  foundationName: 'Yayasan Pendidikan Islam Al Mishbah',
  schoolCoordinates: {
    lat: -6.531200,
    lng: 106.799800,
    radiusMeters: 150,
    name: 'Kampus Utama TK Islam Al Mishbah Cilebut'
  }
};

interface AppContextType {
  currentUser: User;
  users: User[];
  students: Student[];
  teachers: Teacher[];
  staff: Staff[];
  studentAttendance: StudentAttendanceRecord[];
  teacherAttendance: TeacherAttendanceRecord[];
  halaqohAssessments: HalaqohAssessment[];
  sppInvoices: SppInvoice[];
  chatGroups: ChatGroup[];
  chatMessages: ChatMessage[];
  announcements: Announcement[];
  gallery: GalleryItem[];
  notifications: AppNotification[];
  schoolProfile: SchoolProfile;

  // School Profile
  updateSchoolProfile: (profile: Partial<SchoolProfile>) => void;

  // Permissions & Authority
  isAccountOwner: boolean;
  isPrincipal: boolean;
  canEditSchoolData: boolean;
  canManageMasterData: boolean;
  canEditRecord: (
    entityType: 'student' | 'teacher' | 'staff' | 'school' | 'halaqoh' | 'user',
    targetId?: string
  ) => boolean;

  // Auth & Switcher
  isAuthenticated: boolean;
  login: (username: string, password?: string) => boolean;
  loginWithSync: (username: string, password?: string) => Promise<boolean>;
  quickSwitchUser: (userId: string) => void;
  logout: () => void;
  updateUserAvatar: (userId: string, newAvatarUrl: string) => void;
  changeOwnPassword: (oldPassword: string, newPassword: string) => { success: boolean; message: string };
  updateUserCredentials: (userId: string, username: string, password?: string) => { success: boolean; message: string };
  getUserForTeacher: (teacherId: string) => User | undefined;
  getUserForStaff: (staffId: string) => User | undefined;
  getUserForStudent: (studentId: string) => User | undefined;

  // Student CRUD
  addStudent: (student: Omit<Student, 'id' | 'barcode'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (studentId: string) => void;
  deleteStudentsBatch: (studentIds: string[]) => void;
  importStudentsBatch: (
    students: Omit<Student, 'id' | 'barcode'>[],
    mode?: 'append' | 'replace' | 'upsert'
  ) => number;

  // Teacher CRUD
  addTeacher: (teacher: Omit<Teacher, 'id'>, credentials?: { username?: string; password?: string }) => void;
  updateTeacher: (teacher: Teacher, credentials?: { username?: string; password?: string }) => void;
  deleteTeacher: (teacherId: string) => void;
  deleteTeachersBatch: (teacherIds: string[]) => void;
  importTeachersBatch: (
    teachers: Omit<Teacher, 'id'>[],
    mode?: 'append' | 'replace' | 'upsert'
  ) => number;

  // Staff CRUD
  addStaff: (staffMember: Omit<Staff, 'id'>, credentials?: { username?: string; password?: string }) => void;
  updateStaff: (staffMember: Staff, credentials?: { username?: string; password?: string }) => void;
  deleteStaff: (staffId: string) => void;

  // Attendance
  recordTeacherAttendance: (
    teacherId: string,
    selfieUrl: string,
    locationData: TeacherAttendanceRecord['location'],
    notes?: string
  ) => void;
  upsertTeacherAttendance: (
    teacherId: string,
    date: string,
    status: TeacherAttendanceRecord['status'],
    notes?: string,
    time?: string
  ) => void;
  recordStudentAttendance: (
    record: Omit<StudentAttendanceRecord, 'id' | 'date' | 'time'>
  ) => { success: boolean; message: string; record?: StudentAttendanceRecord };
  batchUpdateStudentAttendance: (records: StudentAttendanceRecord[]) => void;

  // Halaqoh
  halaqohGroups: HalaqohGroupInfo[];
  updateStudentHalaqoh: (studentId: string, halaqohGroup: string) => void;
  batchAssignHalaqoh: (studentIds: string[], halaqohGroup: string) => void;
  addHalaqohGroup: (group: Omit<HalaqohGroupInfo, 'id'>) => void;
  updateHalaqohGroup: (group: HalaqohGroupInfo) => void;
  addHalaqohAssessment: (assessment: Omit<HalaqohAssessment, 'id' | 'date'>) => void;
  updateHalaqohAssessment: (assessment: HalaqohAssessment) => void;

  // Leave & Permits (Perizinan Guru & Karyawan - ACC Kepala Sekolah)
  leaveRequests: LeaveRequest[];
  submitLeaveRequest: (
    data: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy' | 'reviewNotes'>
  ) => void;
  approveLeaveRequest: (leaveId: string, reviewNotes?: string) => void;
  rejectLeaveRequest: (leaveId: string, reviewNotes?: string) => void;
  deleteLeaveRequest: (leaveId: string) => void;

  // SPP
  paySppInvoice: (invoiceId: string, method: SppInvoice['paymentMethod'], ref?: string) => void;
  verifySppInvoice: (invoiceId: string) => void;

  // Chat
  sendChatMessage: (text: string, groupId?: string, recipientId?: string, attachmentUrl?: string) => void;

  // Announcements
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => void;

  // Gallery
  addGalleryItem: (item: Omit<GalleryItem, 'id' | 'date'>) => void;

  // Notifications
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: () => void;

  // Owner Management
  updateOwnerUser: (ownerData: Partial<User>) => void;

  // Demo Switcher Setting
  showDemoSwitcher: boolean;
  setShowDemoSwitcher: (show: boolean) => void;
  toggleDemoSwitcher: () => void;

  // Update & Publish + Auto-Save Management
  hasPendingChanges: boolean;
  lastEditedAt: string | null;
  localPublishedVersion: number;
  hasRemoteUpdate: boolean;
  publishMeta: PublishMeta;
  isPublishing: boolean;
  isSyncing: boolean;
  serverReachable: boolean;
  autoSaveStatus: AutoSaveStatus;
  lastAutoSavedAt: string | null;
  lastActionLabel: string | null;
  realtimeConnected: boolean;
  connectedClientsCount: number;
  lastSyncedEvent: RealtimeSyncEvent | null;
  publishUpdates: (note?: string) => Promise<{ success: boolean; message: string; version?: number }>;
  saveDraftToServer: () => Promise<{ success: boolean; message: string }>;
  pullLatestPublished: () => Promise<{ success: boolean; updated: boolean; message: string }>;
  exportBackupJson: () => string;
  importBackupJson: (rawJson: string) => { success: boolean; message: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateUniqueUsername = (
  name: string,
  existingUsers: User[],
  excludeUserId?: string
): string => {
  const cleaned = name
    .toLowerCase()
    .replace(/,.*$/g, '') // drop degrees after comma like S.Pd.I
    .replace(/\b(drs|dr|h|hj|ust|ustadz|ustadzah|bpk|ibu|pak|bunda)\b\.?/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join('.');

  const base = cleaned || 'pegawai';
  let candidate = base;
  let counter = 2;
  while (
    existingUsers.some(
      (u) => u.id !== excludeUserId && u.username.toLowerCase() === candidate.toLowerCase()
    )
  ) {
    candidate = `${base}${counter}`;
    counter++;
  }
  return candidate;
};

const mapDutyToUserRole = (duty?: StaffPosition, fallbackRole: UserRole = 'pegawai'): UserRole => {
  if (duty === 'Kepala Sekolah') return 'kepala_sekolah';
  if (duty === 'Guru' || duty === 'Wali Kelas' || duty === 'Pembimbing Halaqoh') return 'guru';
  if (duty === 'Karyawan' || duty === 'Staff') return 'pegawai';
  return fallbackRole;
};

const deduplicateUsersById = (userList: User[]): User[] => {
  const byId = new Map<string, User>();
  for (const user of userList) {
    if (!user || !user.id) continue;
    byId.set(user.id, {
      ...byId.get(user.id),
      ...user,
      password: user.password || byId.get(user.id)?.password || 'password123'
    });
  }
  return Array.from(byId.values());
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  cleanupBloatedLocalStorage();

  const [students, setStudents] = useState<Student[]>(() =>
    safeJsonParse<Student[]>('tk_mishbah_students', INITIAL_STUDENTS)
  );

  const [teachers, setTeachers] = useState<Teacher[]>(() =>
    safeJsonParse<Teacher[]>('tk_mishbah_teachers', INITIAL_TEACHERS)
  );

  const [staff, setStaff] = useState<Staff[]>(() =>
    safeJsonParse<Staff[]>('tk_mishbah_staff', INITIAL_STAFF)
  );

  // Load users with fallback to initial data + auto-ensure every teacher/staff has a login account & password
  const [users, setUsers] = useState<User[]>(() => {
    let baseUsers: User[] = INITIAL_USERS;
    const saved = localStorage.getItem('tk_mishbah_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        const existingUsernames = new Set(parsed.map((u: User) => u.username.toLowerCase()));
        const existingIds = new Set(parsed.map((u: User) => u.id));
        const missing = INITIAL_USERS.filter(
          (u) => !existingIds.has(u.id) && !existingUsernames.has(u.username.toLowerCase())
        );
        baseUsers = [...parsed, ...missing].map((u) => {
          const initialMatch = INITIAL_USERS.find((iu) => iu.id === u.id);
          return {
            ...u,
            password: u.password || initialMatch?.password || 'password123'
          };
        });
      } catch (e) {
        console.error('Error parsing stored users:', e);
      }
    }

    // Ensure every teacher and staff has a login account
    const syncedUsers = [...baseUsers];
    const savedTeachers: Teacher[] = (() => {
      try {
        const st = localStorage.getItem('tk_mishbah_teachers');
        return st ? JSON.parse(st) : INITIAL_TEACHERS;
      } catch {
        return INITIAL_TEACHERS;
      }
    })();
    const savedStaff: Staff[] = (() => {
      try {
        const sf = localStorage.getItem('tk_mishbah_staff');
        return sf ? JSON.parse(sf) : INITIAL_STAFF;
      } catch {
        return INITIAL_STAFF;
      }
    })();

    savedTeachers.forEach((tch) => {
      if (!syncedUsers.some((u) => u.relatedTeacherId === tch.id)) {
        const role = mapDutyToUserRole(tch.assignedDuty, 'guru');
        syncedUsers.push({
          id: `user-${tch.id}`,
          username: generateUniqueUsername(tch.name, syncedUsers),
          password: 'password123',
          name: tch.name,
          role,
          isPrincipal: role === 'kepala_sekolah',
          relatedTeacherId: tch.id,
          avatarUrl: tch.photoUrl,
          email: tch.email,
          phone: tch.phone,
          position: tch.position
        });
      }
    });

    savedStaff.forEach((st) => {
      if (!syncedUsers.some((u) => u.relatedStaffId === st.id)) {
        const role = mapDutyToUserRole(st.assignedDuty, 'pegawai');
        syncedUsers.push({
          id: `user-${st.id}`,
          username: generateUniqueUsername(st.name, syncedUsers),
          password: 'password123',
          name: st.name,
          role,
          isPrincipal: role === 'kepala_sekolah',
          relatedStaffId: st.id,
          avatarUrl: st.photoUrl,
          phone: st.phone,
          position: st.position || st.department
        });
      }
    });

    const savedStudents: Student[] = (() => {
      try {
        const sd = localStorage.getItem('tk_mishbah_students');
        return sd ? JSON.parse(sd) : INITIAL_STUDENTS;
      } catch {
        return INITIAL_STUDENTS;
      }
    })();

    savedStudents.forEach((std) => {
      const targetId = `user-ortu-${std.id}`;
      if (!syncedUsers.some((u) => u.relatedStudentId === std.id || u.id === targetId)) {
        const childFirst = (std.nickName || std.name.split(' ')[0] || 'santri')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        const parentUserSlug = `ortu.${childFirst || std.id.toLowerCase()}`;
        const uniqueOrtuUsername = generateUniqueUsername(parentUserSlug, syncedUsers);
        syncedUsers.push({
          id: targetId,
          username: uniqueOrtuUsername,
          password: 'password123',
          name: `${std.parentName} (Wali ${std.nickName || std.name.split(' ')[0]})`,
          role: 'ortu',
          relatedStudentId: std.id,
          avatarUrl: std.photoUrl || SCHOOL_ASSETS.logo,
          email: std.parentEmail,
          phone: std.parentPhone,
          position: `Wali Murid ${std.className}`
        });
      }
    });

    return deduplicateUsersById(syncedUsers);
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      localStorage.removeItem('tk_mishbah_authenticated');
      return sessionStorage.getItem('tk_mishbah_session_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('tk_mishbah_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          password: parsed.password || 'password123'
        };
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_USERS[0]; // Default to Pemilik Akun
  });

  // Authority & Role Verification
  const isAccountOwner = Boolean(
    currentUser.isOwner ||
    currentUser.role === 'owner' ||
    currentUser.username === 'pemilik.akun' ||
    currentUser.position?.toLowerCase().includes('pemilik akun')
  );

  const isPrincipal = Boolean(
    currentUser.isPrincipal ||
    currentUser.role === 'kepala_sekolah' ||
    currentUser.username === 'kepala.sekolah' ||
    currentUser.position?.toLowerCase().includes('kepala sekolah') ||
    currentUser.name?.toLowerCase().includes('khadijah')
  );

  // General editing authority across school master data, legal identity, credentials & approvals:
  // STRICTLY ONLY Pemilik Akun
  const canEditSchoolData = isAccountOwner;

  // Master data management authority (Data Guru, Staf, Murid & Halaqoh):
  // STRICTLY ONLY Pemilik Akun (Guru/Staf & Wali Murid tidak dapat mengubah/edit master data)
  const canManageMasterData = isAccountOwner;

  // Granular check: only Pemilik Akun can edit master/school records; users can only update their own account avatar/password
  const canEditRecord = (
    entityType: 'student' | 'teacher' | 'staff' | 'school' | 'halaqoh' | 'user',
    targetId?: string
  ): boolean => {
    if (isAccountOwner) return true;
    if (entityType === 'user' && targetId) {
      return currentUser.id === targetId;
    }
    return false;
  };

  // State arrays moved above for user sync initialization

  const mergeTeacherAttendanceBackfill = (
    existing: TeacherAttendanceRecord[],
    rosterTeachers: Teacher[] = INITIAL_TEACHERS,
    rosterStaff: Staff[] = INITIAL_STAFF
  ): TeacherAttendanceRecord[] => {
    if (!Array.isArray(existing) || existing.length === 0) {
      return INITIAL_TEACHER_ATTENDANCE;
    }

    const merged = [...existing];
    const seenKeys = new Set(existing.map((r) => `${r.teacherId}__${r.date}`));
    const rosterIds = new Set([
      ...rosterTeachers.map((t) => t.id),
      ...rosterStaff.map((s) => s.id)
    ]);

    // Backfill matching initial records if a teacher or staff member has zero records yet
    const personsWithoutRecords = new Set(
      [...rosterIds].filter((id) => !merged.some((r) => r.teacherId === id))
    );

    if (existing.length <= 4 || personsWithoutRecords.size > 0) {
      INITIAL_TEACHER_ATTENDANCE.forEach((item) => {
        const key = `${item.teacherId}__${item.date}`;
        const shouldInclude =
          existing.length <= 4
            ? rosterIds.size === 0 || rosterIds.has(item.teacherId)
            : personsWithoutRecords.has(item.teacherId);
        if (!seenKeys.has(key) && shouldInclude) {
          seenKeys.add(key);
          merged.push(item);
        }
      });
    }

    // Ensure custom teachers/staff not in INITIAL_TEACHER_ATTENDANCE also get recent school-day baseline if empty
    const combinedRoster = [
      ...rosterTeachers.map((t) => ({ id: t.id, name: t.name, photoUrl: t.photoUrl, isStaff: false })),
      ...rosterStaff.map((s) => ({ id: s.id, name: s.name, photoUrl: s.photoUrl, isStaff: true }))
    ];

    const baseDate = new Date();
    let seq = 1;
    combinedRoster.forEach((person, pIdx) => {
      const hasAnyForPerson = merged.some((r) => r.teacherId === person.id);
      if (hasAnyForPerson) return;

      for (let offset = 0; offset <= 35; offset++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - offset);
        const day = d.getDay();
        if (day === 0 || day === 6) continue;
        const dateStr = d.toISOString().split('T')[0];
        const key = `${person.id}__${dateStr}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        const seed = offset * 5 + pIdx * 3;
        const status: TeacherAttendanceRecord['status'] =
          seed % 19 === 0 ? 'Sakit' : seed % 17 === 0 ? 'Izin' : seed % 9 === 0 ? 'Terlambat' : 'Hadir Tepat Waktu';
        const time =
          status === 'Sakit' || status === 'Izin'
            ? '07:00:00'
            : status === 'Terlambat'
            ? `07:${34 + (seed % 12)}:${String((seed * 7) % 50 + 10).padStart(2, '0')}`
            : `07:0${(seed % 9) + 1}:${String((seed * 5) % 50 + 10).padStart(2, '0')}`;

        const generatedPhotoUrl =
          person.photoUrl && !person.photoUrl.startsWith('data:') ? person.photoUrl : '';

        merged.push({
          id: `att-custom-${person.id}-${seq++}`,
          date: dateStr,
          time,
          teacherId: person.id,
          teacherName: person.name,
          selfieUrl: generatedPhotoUrl,
          status,
          notes:
            status === 'Sakit'
              ? 'Surat keterangan sakit'
              : status === 'Izin'
              ? 'Izin keperluan keluarga'
              : status === 'Terlambat'
              ? 'Terlambat masuk pagi'
              : person.isStaff
              ? 'Presensi operasional & administrasi sekolah'
              : 'Presensi pagi & mengajar kelas',
          location: {
            lat: -6.22972,
            lng: 106.82951,
            accuracy: 8,
            distanceMeters: 15,
            inRadius: true,
            addressDescription: 'Kampus Utama TK Islam Al Mishbah'
          }
        });
      }
    });

    return merged;
  };

  const [studentAttendance, setStudentAttendance] = useState<StudentAttendanceRecord[]>(() =>
    safeJsonParse<StudentAttendanceRecord[]>('tk_mishbah_std_att', INITIAL_STUDENT_ATTENDANCE)
  );

  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendanceRecord[]>(() =>
    mergeTeacherAttendanceBackfill(
      safeJsonParse<TeacherAttendanceRecord[]>('tk_mishbah_tch_att', INITIAL_TEACHER_ATTENDANCE),
      safeJsonParse<Teacher[]>('tk_mishbah_teachers', INITIAL_TEACHERS),
      safeJsonParse<Staff[]>('tk_mishbah_staff', INITIAL_STAFF)
    )
  );

  const mergeHalaqohBackfill = (existing: HalaqohAssessment[]): HalaqohAssessment[] => {
    const normalized = existing.map((item) => ({
      ...item,
      category:
        item.category ||
        (item.type === 'Membaca Iqro' || item.type === 'Tilawati/Iqro' ? 'Iqro' : 'Tahfidz')
    }));
    const existingIds = new Set(normalized.map((item) => item.id));
    const missingInitial = INITIAL_HALAQOH_ASSESSMENTS.filter(
      (initItem) => !existingIds.has(initItem.id)
    );
    return [...normalized, ...missingInitial];
  };

  const [halaqohAssessments, setHalaqohAssessments] = useState<HalaqohAssessment[]>(() =>
    mergeHalaqohBackfill(
      safeJsonParse<HalaqohAssessment[]>('tk_mishbah_halaqoh', INITIAL_HALAQOH_ASSESSMENTS)
    )
  );

  const [halaqohGroups, setHalaqohGroups] = useState<HalaqohGroupInfo[]>(() =>
    safeJsonParse<HalaqohGroupInfo[]>('tk_mishbah_halaqoh_groups', INITIAL_HALAQOH_GROUPS)
  );

  const [sppInvoices, setSppInvoices] = useState<SppInvoice[]>(() =>
    safeJsonParse<SppInvoice[]>('tk_mishbah_spp', INITIAL_SPP_INVOICES)
  );

  const [chatGroups] = useState<ChatGroup[]>(INITIAL_CHAT_GROUPS);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    safeJsonParse<ChatMessage[]>('tk_mishbah_chats', INITIAL_CHAT_MESSAGES)
  );

  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    safeJsonParse<Announcement[]>('tk_mishbah_announcements', INITIAL_ANNOUNCEMENTS)
  );

  const [gallery, setGallery] = useState<GalleryItem[]>(() =>
    safeJsonParse<GalleryItem[]>('tk_mishbah_gallery', INITIAL_GALLERY)
  );

  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    safeJsonParse<AppNotification[]>('tk_mishbah_notifs', INITIAL_NOTIFICATIONS)
  );

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() =>
    safeJsonParse<LeaveRequest[]>('tk_mishbah_leaves', INITIAL_LEAVE_REQUESTS)
  );

  const [showDemoSwitcher, setShowDemoSwitcher] = useState<boolean>(() =>
    safeJsonParse<boolean>('tk_mishbah_demo_switcher', true)
  );

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    const saved = localStorage.getItem('tk_mishbah_school_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.npsn && parsed.npsn.includes('Akreditasi')) {
          parsed.npsn = parsed.npsn.split('|')[0].trim();
        }
        if (!parsed.logoUrl || parsed.logoUrl.includes('tk_al_mishbah_logo') || parsed.logoUrl.includes('1792761852277')) {
          parsed.logoUrl = SCHOOL_ASSETS.logo;
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_SCHOOL_PROFILE;
  });

  // LocalStorage sync effects (quota-safe)
  useEffect(() => {
    safeStorageSet('tk_mishbah_school_profile', schoolProfile);
  }, [schoolProfile]);
  useEffect(() => {
    safeStorageSet('tk_mishbah_current_user', currentUser);
  }, [currentUser]);
  useEffect(() => {
    try {
      if (isAuthenticated) {
        sessionStorage.setItem('tk_mishbah_session_auth', 'true');
      } else {
        sessionStorage.removeItem('tk_mishbah_session_auth');
      }
    } catch {
      // ignore storage errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_users', users);
  }, [users]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_students', students);
  }, [students]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_teachers', teachers);
  }, [teachers]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_staff', staff);
  }, [staff]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_std_att', studentAttendance);
  }, [studentAttendance]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_tch_att', teacherAttendance);
  }, [teacherAttendance]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_halaqoh', halaqohAssessments);
  }, [halaqohAssessments]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_halaqoh_groups', halaqohGroups);
  }, [halaqohGroups]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_spp', sppInvoices);
  }, [sppInvoices]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_chats', chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_announcements', announcements);
  }, [announcements]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_gallery', gallery);
  }, [gallery]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_notifs', notifications);
  }, [notifications]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_leaves', leaveRequests);
  }, [leaveRequests]);

  useEffect(() => {
    safeStorageSet('tk_mishbah_demo_switcher', showDemoSwitcher);
  }, [showDemoSwitcher]);

  const toggleDemoSwitcher = () => setShowDemoSwitcher((prev) => !prev);

  // Update, Auto-Save & Server Synchronization
  const ALL_SNAPSHOT_KEYS: (keyof AppSnapshot)[] = [
    'schoolProfile',
    'users',
    'students',
    'teachers',
    'staff',
    'halaqohGroups',
    'studentAttendance',
    'teacherAttendance',
    'halaqohAssessments',
    'leaveRequests',
    'sppInvoices',
    'chatMessages',
    'announcements',
    'gallery',
    'notifications'
  ];

  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(() =>
    safeJsonParse<boolean>('tk_mishbah_pending_changes', false)
  );
  const [lastEditedAt, setLastEditedAt] = useState<string | null>(() => {
    return localStorage.getItem('tk_mishbah_last_edited_at');
  });
  const [localPublishedVersion, setLocalPublishedVersion] = useState<number>(() => {
    return Number(localStorage.getItem('tk_mishbah_published_version') || '0');
  });
  const [publishMeta, setPublishMeta] = useState<PublishMeta>({
    publishedVersion: 0,
    lastPublishedAt: null,
    publishedBy: null,
    publishNote: null,
    draftVersion: 0,
    lastDraftSavedAt: null,
    draftSavedBy: null,
    lastActionLabel: null,
    hasPublishedSnapshot: false,
    hasDraftSnapshot: false,
    history: []
  });
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [serverReachable, setServerReachable] = useState<boolean>(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('synced');
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(() =>
    localStorage.getItem('tk_mishbah_last_autosaved_at')
  );
  const [lastActionLabel, setLastActionLabel] = useState<string | null>(() =>
    localStorage.getItem('tk_mishbah_last_action_label')
  );
  const [autoSaveTick, setAutoSaveTick] = useState<number>(0);
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);
  const [connectedClientsCount, setConnectedClientsCount] = useState<number>(1);
  const [lastSyncedEvent, setLastSyncedEvent] = useState<RealtimeSyncEvent | null>(null);

  const stateRef = useRef({
    schoolProfile,
    users,
    students,
    teachers,
    staff,
    halaqohGroups,
    studentAttendance,
    teacherAttendance,
    halaqohAssessments,
    leaveRequests,
    sppInvoices,
    chatMessages,
    announcements,
    gallery,
    notifications,
    currentUser
  });
  stateRef.current = {
    schoolProfile,
    users,
    students,
    teachers,
    staff,
    halaqohGroups,
    studentAttendance,
    teacherAttendance,
    halaqohAssessments,
    leaveRequests,
    sppInvoices,
    chatMessages,
    announcements,
    gallery,
    notifications,
    currentUser
  };

  const dirtyKeysRef = useRef<Set<keyof AppSnapshot>>(
    new Set(safeJsonParse<(keyof AppSnapshot)[]>('tk_mishbah_pending_keys', []))
  );
  const inFlightKeysRef = useRef<Set<keyof AppSnapshot>>(new Set());
  const deletedIdsRef = useRef<Record<string, Set<string>>>({});
  const replaceKeysRef = useRef<Set<keyof AppSnapshot>>(new Set());
  const actionLabelsRef = useRef<string[]>([]);
  const isFlushingRef = useRef<boolean>(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localPublishedVersionRef = useRef<number>(localPublishedVersion);
  localPublishedVersionRef.current = localPublishedVersion;
  const localStoreIdRef = useRef<string>(
    (() => {
      try {
        return localStorage.getItem('tk_mishbah_store_id') || '';
      } catch {
        return '';
      }
    })()
  );
  const lastSyncedEventRef = useRef<RealtimeSyncEvent | null>(lastSyncedEvent);
  lastSyncedEventRef.current = lastSyncedEvent;
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const clientIdRef = useRef<string>(
    `cli-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const hasSeededEmptyServerRef = useRef<boolean>(false);
  const isBootstrappingServerRef = useRef<boolean>(false);
  const isRemoteUpdateRef = useRef<boolean>(false);
  const publishMetaRef = useRef<PublishMeta>(publishMeta);
  publishMetaRef.current = publishMeta;
  const pendingRemoteUpdateRef = useRef<{
    snapshot: AppSnapshot;
    meta: PublishMeta;
  } | null>(null);
  const isAuthenticatedRef = useRef<boolean>(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;
  const isAccountOwnerRef = useRef<boolean>(isAccountOwner);
  isAccountOwnerRef.current = isAccountOwner;

  const persistPendingKeys = () => {
    const combined = new Set<keyof AppSnapshot>([
      ...dirtyKeysRef.current,
      ...inFlightKeysRef.current
    ]);
    const arr = Array.from(combined);
    safeStorageSet('tk_mishbah_pending_keys', arr);
    safeStorageSet('tk_mishbah_pending_changes', arr.length > 0);
  };

  const setLocalStoreId = (storeId?: string | null) => {
    if (!storeId) return;
    localStoreIdRef.current = storeId;
    safeStorageSetRaw('tk_mishbah_store_id', storeId);
  };

  const syncMetaDisplay = (meta: PublishMeta) => {
    publishMetaRef.current = meta;
    setPublishMeta(meta);
    if (typeof meta.connectedClients === 'number') {
      setConnectedClientsCount(Math.max(1, meta.connectedClients));
    }
    if (meta.lastPublishedAt) {
      setLastAutoSavedAt(meta.lastPublishedAt);
    }
    if (meta.lastActionLabel) {
      setLastActionLabel(meta.lastActionLabel);
    }
    if (meta.publishedVersion > 0 && meta.lastPublishedAt && meta.lastActionLabel) {
      const prevEvt = lastSyncedEventRef.current;
      if (!prevEvt || meta.publishedVersion >= prevEvt.version) {
        setLastSyncedEvent({
          version: meta.publishedVersion,
          actionLabel: meta.lastActionLabel,
          savedBy: meta.publishedBy || 'Pengguna Sekolah',
          timestamp: meta.lastPublishedAt
        });
      }
    }
  };

  useEffect(() => {
    safeStorageSet('tk_mishbah_pending_changes', hasPendingChanges);
    if (!hasPendingChanges && dirtyKeysRef.current.size === 0) {
      safeStorageSet('tk_mishbah_pending_keys', []);
    }
  }, [hasPendingChanges]);

  useEffect(() => {
    if (lastEditedAt) {
      safeStorageSetRaw('tk_mishbah_last_edited_at', lastEditedAt);
    } else {
      localStorage.removeItem('tk_mishbah_last_edited_at');
    }
  }, [lastEditedAt]);

  useEffect(() => {
    if (lastAutoSavedAt) {
      safeStorageSetRaw('tk_mishbah_last_autosaved_at', lastAutoSavedAt);
    }
  }, [lastAutoSavedAt]);

  useEffect(() => {
    if (lastActionLabel) {
      safeStorageSetRaw('tk_mishbah_last_action_label', lastActionLabel);
    }
  }, [lastActionLabel]);

  useEffect(() => {
    safeStorageSetRaw('tk_mishbah_published_version', String(localPublishedVersion));
  }, [localPublishedVersion]);

  const markEdited = (
    changedKeys?: (keyof AppSnapshot)[],
    actionLabel?: string,
    options?: {
      deletedIds?: Record<string, string[]>;
      replaceKeys?: (keyof AppSnapshot)[];
    }
  ) => {
    if (isRemoteUpdateRef.current) return;
    const keysToMark = changedKeys && changedKeys.length > 0 ? changedKeys : ALL_SNAPSHOT_KEYS;
    keysToMark.forEach((k) => dirtyKeysRef.current.add(k));
    persistPendingKeys();

    if (options?.deletedIds) {
      Object.entries(options.deletedIds).forEach(([k, ids]) => {
        if (!deletedIdsRef.current[k]) deletedIdsRef.current[k] = new Set<string>();
        ids.forEach((id) => deletedIdsRef.current[k].add(id));
      });
    }

    if (options?.replaceKeys) {
      options.replaceKeys.forEach((k) => replaceKeysRef.current.add(k));
    }

    if (actionLabel) {
      actionLabelsRef.current.push(actionLabel);
      setLastActionLabel(actionLabel);
    }

    setHasPendingChanges(true);
    setLastEditedAt(new Date().toISOString());
    setAutoSaveStatus('saving');
    setAutoSaveTick((tick) => tick + 1);
  };

  const compactTeacherAttendanceSlice = (records: TeacherAttendanceRecord[]) =>
    records.slice(0, 220).map((rec, idx) => {
      if (idx > 12 && rec.selfieUrl && rec.selfieUrl.startsWith('data:')) {
        return { ...rec, selfieUrl: '' };
      }
      return rec;
    });

  const buildSnapshotFromState = (s = stateRef.current): AppSnapshot => ({
    schoolProfile: s.schoolProfile,
    users: s.users,
    students: s.students,
    teachers: s.teachers,
    staff: s.staff,
    halaqohGroups: s.halaqohGroups,
    studentAttendance: s.studentAttendance,
    teacherAttendance: compactTeacherAttendanceSlice(s.teacherAttendance),
    halaqohAssessments: s.halaqohAssessments,
    leaveRequests: s.leaveRequests,
    sppInvoices: s.sppInvoices,
    chatMessages: s.chatMessages,
    announcements: s.announcements,
    gallery: s.gallery,
    notifications: s.notifications.slice(0, 60)
  });

  const buildSnapshot = (): AppSnapshot => buildSnapshotFromState(stateRef.current);

  const buildCompactSnapshot = (): AppSnapshot => buildSnapshotFromState(stateRef.current);

  const applySnapshot = (snapshot: AppSnapshot, version: number, storeId?: string) => {
    isRemoteUpdateRef.current = true;
    try {
      if (snapshot.schoolProfile) setSchoolProfile(snapshot.schoolProfile);
      if (Array.isArray(snapshot.users)) {
        const normalizedUsers = snapshot.users.map((u) => ({
          ...u,
          password: u.password || 'password123'
        }));
        const rosterStudents = Array.isArray(snapshot.students) ? snapshot.students : stateRef.current.students;
        rosterStudents.forEach((std) => {
          if (!normalizedUsers.some((u) => u.relatedStudentId === std.id)) {
            const childFirst = (std.nickName || std.name.split(' ')[0] || 'santri')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '');
            const uniqueOrtuUsername = generateUniqueUsername(
              `ortu.${childFirst || std.id.toLowerCase()}`,
              normalizedUsers
            );
            normalizedUsers.push({
              id: `user-ortu-${std.id}`,
              username: uniqueOrtuUsername,
              password: 'password123',
              name: `${std.parentName} (Wali ${std.nickName || std.name.split(' ')[0]})`,
              role: 'ortu',
              relatedStudentId: std.id,
              avatarUrl: std.photoUrl || SCHOOL_ASSETS.logo,
              email: std.parentEmail,
              phone: std.parentPhone,
              position: `Wali Murid ${std.className}`
            });
          }
        });
        const deduplicatedUsers = deduplicateUsersById(normalizedUsers);
        setUsers(deduplicatedUsers);
        const activeUser = stateRef.current.currentUser;
        const matched = deduplicatedUsers.find(
          (u) => u.id === activeUser.id || u.username.toLowerCase() === activeUser.username.toLowerCase()
        );
        if (matched) {
          setCurrentUser(matched);
        }
      }
      if (Array.isArray(snapshot.students)) setStudents(snapshot.students);
      if (Array.isArray(snapshot.teachers)) setTeachers(snapshot.teachers);
      if (Array.isArray(snapshot.staff)) setStaff(snapshot.staff);
      if (Array.isArray(snapshot.halaqohGroups)) setHalaqohGroups(snapshot.halaqohGroups);
      if (Array.isArray(snapshot.studentAttendance)) setStudentAttendance(snapshot.studentAttendance);
      if (Array.isArray(snapshot.teacherAttendance)) {
        const rosterTeachers = Array.isArray(snapshot.teachers) ? snapshot.teachers : stateRef.current.teachers;
        const rosterStaff = Array.isArray(snapshot.staff) ? snapshot.staff : stateRef.current.staff;
        setTeacherAttendance(mergeTeacherAttendanceBackfill(snapshot.teacherAttendance, rosterTeachers, rosterStaff));
      }
      if (Array.isArray(snapshot.halaqohAssessments)) {
        setHalaqohAssessments(mergeHalaqohBackfill(snapshot.halaqohAssessments));
      }
      if (Array.isArray(snapshot.leaveRequests)) setLeaveRequests(snapshot.leaveRequests);
      if (Array.isArray(snapshot.sppInvoices)) setSppInvoices(snapshot.sppInvoices);
      if (Array.isArray(snapshot.chatMessages)) setChatMessages(snapshot.chatMessages);
      if (Array.isArray(snapshot.announcements)) setAnnouncements(snapshot.announcements);
      if (Array.isArray(snapshot.gallery)) setGallery(snapshot.gallery);
      if (Array.isArray(snapshot.notifications)) setNotifications(snapshot.notifications);
      localPublishedVersionRef.current = version;
      setLocalPublishedVersion(version);
      if (storeId) {
        setLocalStoreId(storeId);
      }
      if (dirtyKeysRef.current.size === 0 && inFlightKeysRef.current.size === 0) {
        setHasPendingChanges(false);
        setLastEditedAt(null);
        setAutoSaveStatus('synced');
      }
    } finally {
      isRemoteUpdateRef.current = false;
    }
  };

  const fetchWithRetry = async (
    url: string,
    options?: RequestInit,
    retries = 2
  ): Promise<Response> => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          credentials: 'same-origin',
          cache: 'no-store',
          ...options
        });
        return res;
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  };

  const flushAutoSave = async (useKeepalive = false): Promise<boolean> => {
    if (isFlushingRef.current || dirtyKeysRef.current.size === 0) {
      return true;
    }

    isFlushingRef.current = true;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const keysSnapshot = Array.from(dirtyKeysRef.current);
    dirtyKeysRef.current.clear();
    keysSnapshot.forEach((k) => inFlightKeysRef.current.add(k));
    // Keep in-flight keys persisted in localStorage until server confirms save
    persistPendingKeys();

    const deletedSnapshot: Record<string, string[]> = {};
    Object.entries(deletedIdsRef.current).forEach(([k, set]) => {
      if (set.size > 0) deletedSnapshot[k] = Array.from(set);
    });
    deletedIdsRef.current = {};

    const replaceSnapshot = Array.from(replaceKeysRef.current);
    replaceKeysRef.current.clear();

    const labelsSnapshot = [...actionLabelsRef.current];
    actionLabelsRef.current = [];
    const actionLabel =
      labelsSnapshot.length > 0
        ? Array.from(new Set(labelsSnapshot)).slice(-2).join(' • ')
        : 'Simpan & Update Otomatis';

    const latestFullSnapshot = buildSnapshotFromState(stateRef.current);
    const patch: Partial<AppSnapshot> = {};
    keysSnapshot.forEach((key) => {
      (patch as Record<string, unknown>)[key] = (latestFullSnapshot as unknown as Record<string, unknown>)[key];
    });

    const activeUser = stateRef.current.currentUser;
    setAutoSaveStatus('saving');
    let shouldScheduleNextFlush = false;

    try {
      const shouldIncludeFull =
        !publishMetaRef.current.hasPublishedSnapshot || replaceSnapshot.length > 0;
      const postPayload = (includeFull: boolean) => {
        const bodyStr = JSON.stringify({
          patch,
          ...(includeFull ? { fullSnapshot: latestFullSnapshot } : {}),
          savedBy: `${activeUser.name} (@${activeUser.username})`,
          actionLabel,
          deletedIdsByKey: deletedSnapshot,
          replaceKeys: replaceSnapshot,
          clientId: clientIdRef.current
        });
        // Browsers hard-fail fetch with keepalive:true above 64KB; only enable keepalive under 60KB
        const canUseKeepalive = useKeepalive && bodyStr.length <= 60_000;
        return fetch('/api/autosave', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          keepalive: canUseKeepalive,
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': clientIdRef.current
          },
          body: bodyStr
        });
      };

      let res = await postPayload(shouldIncludeFull);
      if (res.status === 409 && !shouldIncludeFull) {
        res = await postPayload(true);
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as {
        success: boolean;
        meta?: PublishMeta;
        snapshot?: AppSnapshot;
      };

      if (!data.success || !data.meta) {
        throw new Error('Auto-save server response invalid');
      }

      inFlightKeysRef.current.clear();
      persistPendingKeys();

      setServerReachable(true);
      syncMetaDisplay(data.meta);
      localPublishedVersionRef.current = data.meta.publishedVersion;
      setLocalPublishedVersion(data.meta.publishedVersion);
      if (data.meta.storeId) {
        setLocalStoreId(data.meta.storeId);
      }

      try {
        broadcastRef.current?.postMessage({
          type: 'synced',
          version: data.meta.publishedVersion
        });
      } catch {
        // ignore BroadcastChannel errors
      }

      if (dirtyKeysRef.current.size === 0) {
        setHasPendingChanges(false);
        setLastEditedAt(null);
        setAutoSaveStatus('synced');
        const queuedRemote = pendingRemoteUpdateRef.current;
        pendingRemoteUpdateRef.current = null;
        if (queuedRemote && queuedRemote.meta.publishedVersion > data.meta.publishedVersion) {
          applySnapshot(queuedRemote.snapshot, queuedRemote.meta.publishedVersion, queuedRemote.meta.storeId);
          syncMetaDisplay(queuedRemote.meta);
        }
      } else {
        shouldScheduleNextFlush = true;
      }
      return true;
    } catch (err) {
      console.warn('Auto-save deferred (offline/retrying):', err);
      inFlightKeysRef.current.clear();
      keysSnapshot.forEach((k) => dirtyKeysRef.current.add(k));
      persistPendingKeys();
      Object.entries(deletedSnapshot).forEach(([k, ids]) => {
        if (!deletedIdsRef.current[k]) deletedIdsRef.current[k] = new Set<string>();
        ids.forEach((id) => deletedIdsRef.current[k].add(id));
      });
      replaceSnapshot.forEach((k) => replaceKeysRef.current.add(k));
      actionLabelsRef.current = [...labelsSnapshot, ...actionLabelsRef.current];

      setServerReachable(false);
      setAutoSaveStatus('offline');

      if (!retryTimerRef.current) {
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          if (dirtyKeysRef.current.size > 0) {
            void flushAutoSave();
          }
        }, 4000);
      }
      return false;
    } finally {
      isFlushingRef.current = false;
      if (shouldScheduleNextFlush && dirtyKeysRef.current.size > 0) {
        setTimeout(() => {
          void flushAutoSave();
        }, 120);
      }
    }
  };

  useEffect(() => {
    if (dirtyKeysRef.current.size === 0) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      void flushAutoSave();
    }, 150);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveTick]);

  const pullLatestPublished = async (): Promise<{
    success: boolean;
    updated: boolean;
    message: string;
  }> => {
    setIsSyncing(true);
    try {
      if (dirtyKeysRef.current.size > 0) {
        await flushAutoSave();
      }
      const res = await fetchWithRetry('/api/publish/snapshot', undefined, 1);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        success: boolean;
        meta: PublishMeta;
        snapshot: AppSnapshot | null;
      };
      setServerReachable(true);
      if (data.meta) {
        syncMetaDisplay(data.meta);
      }
      if (data.snapshot && data.meta?.hasPublishedSnapshot) {
        applySnapshot(data.snapshot, data.meta.publishedVersion, data.meta.storeId);
        return {
          success: true,
          updated: true,
          message: `Data berhasil disinkronkan otomatis ke versi live v${data.meta.publishedVersion}.`
        };
      }
      return {
        success: true,
        updated: false,
        message: 'Server belum memiliki versi yang dipublish. Menampilkan data lokal saat ini.'
      };
    } catch (err) {
      console.warn('Pull snapshot deferred (server unavailable):', err);
      setServerReachable(false);
      return {
        success: false,
        updated: false,
        message: 'Server sedang menyegarkan koneksi. Data lokal Anda tetap aman dan tersimpan di browser.'
      };
    } finally {
      setIsSyncing(false);
    }
  };

  const saveDraftToServer = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetchWithRetry('/api/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot: buildCompactSnapshot(),
          savedBy: `${currentUser.name} (@${currentUser.username})`
        })
      });
      const data = (await res.json()) as {
        success: boolean;
        message?: string;
        meta?: PublishMeta;
      };
      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Gagal menyimpan draft ke server.'
        };
      }
      setServerReachable(true);
      if (data.meta) setPublishMeta(data.meta);
      return {
        success: true,
        message: data.message || 'Draft perubahan berhasil disimpan ke server.'
      };
    } catch (err) {
      console.warn('Draft saved locally (server unreachable):', err);
      setServerReachable(false);
      return {
        success: false,
        message: 'Perubahan tersimpan di browser lokal. Koneksi ke server gagal — muat ulang halaman lalu coba Simpan Draft lagi.'
      };
    }
  };

  const publishUpdates = async (
    note?: string
  ): Promise<{ success: boolean; message: string; version?: number }> => {
    if (!isAccountOwner) {
      return {
        success: false,
        message: 'Hanya Pemilik Akun yang dapat melakukan Update & Publish.'
      };
    }
    setIsPublishing(true);
    try {
      const snapshot = buildCompactSnapshot();
      const res = await fetchWithRetry('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientIdRef.current
        },
        body: JSON.stringify({
          snapshot,
          publishedBy: `${currentUser.name} (@${currentUser.username})`,
          note: note?.trim() || undefined,
          clientId: clientIdRef.current
        })
      });
      const data = (await res.json()) as {
        success: boolean;
        message?: string;
        meta?: PublishMeta;
      };
      if (!res.ok || !data.success || !data.meta) {
        return {
          success: false,
          message: data.message || 'Gagal mempublish pembaruan ke server.'
        };
      }
      dirtyKeysRef.current.clear();
      inFlightKeysRef.current.clear();
      persistPendingKeys();
      deletedIdsRef.current = {};
      replaceKeysRef.current.clear();
      actionLabelsRef.current = [];
      setServerReachable(true);
      syncMetaDisplay(data.meta);
      localPublishedVersionRef.current = data.meta.publishedVersion;
      setLocalPublishedVersion(data.meta.publishedVersion);
      if (data.meta.storeId) setLocalStoreId(data.meta.storeId);
      setHasPendingChanges(false);
      setLastEditedAt(null);
      setAutoSaveStatus('synced');
      addNotification({
        title: `🚀 Update & Publish Berhasil (v${data.meta.publishedVersion})`,
        message: data.meta.publishNote || 'Perubahan aplikasi telah dipublish dan aktif di semua perangkat.',
        type: 'success',
        forRole: 'all'
      });
      return {
        success: true,
        message: data.message || `Berhasil dipublish sebagai Versi v${data.meta.publishedVersion}!`,
        version: data.meta.publishedVersion
      };
    } catch (err) {
      console.warn('Publish deferred (server unreachable):', err);
      setServerReachable(false);
      return {
        success: false,
        message: 'Koneksi ke server terputus saat publish. Data Anda tetap aman di browser — muat ulang halaman dan coba Update & Publish kembali.'
      };
    } finally {
      setIsPublishing(false);
    }
  };

  const exportBackupJson = (): string => {
    const payload = {
      appName: 'TK Islam Al Mishbah',
      exportedAt: new Date().toISOString(),
      publishedVersion: localPublishedVersion,
      snapshot: buildSnapshot()
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const todayStr = new Date().toISOString().split('T')[0];
    const filename = `tk-almishbah-backup-v${localPublishedVersion || 1}-${todayStr}.json`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return filename;
  };

  const importBackupJson = (rawJson: string): { success: boolean; message: string } => {
    if (!isAccountOwner) {
      return { success: false, message: 'Hanya Pemilik Akun yang dapat memulihkan backup data.' };
    }
    try {
      const parsed = JSON.parse(rawJson) as { snapshot?: AppSnapshot } & Partial<AppSnapshot>;
      const snap = (parsed.snapshot || parsed) as AppSnapshot;
      if (!snap || (!snap.schoolProfile && !Array.isArray(snap.students))) {
        return { success: false, message: 'Format file backup JSON tidak sesuai.' };
      }
      if (snap.schoolProfile) setSchoolProfile(snap.schoolProfile);
      if (Array.isArray(snap.users)) setUsers(deduplicateUsersById(snap.users));
      if (Array.isArray(snap.students)) setStudents(snap.students);
      if (Array.isArray(snap.teachers)) setTeachers(snap.teachers);
      if (Array.isArray(snap.staff)) setStaff(snap.staff);
      if (Array.isArray(snap.halaqohGroups)) setHalaqohGroups(snap.halaqohGroups);
      if (Array.isArray(snap.studentAttendance)) setStudentAttendance(snap.studentAttendance);
      if (Array.isArray(snap.teacherAttendance)) setTeacherAttendance(snap.teacherAttendance);
      if (Array.isArray(snap.halaqohAssessments)) setHalaqohAssessments(snap.halaqohAssessments);
      if (Array.isArray(snap.leaveRequests)) setLeaveRequests(snap.leaveRequests);
      if (Array.isArray(snap.sppInvoices)) setSppInvoices(snap.sppInvoices);
      if (Array.isArray(snap.chatMessages)) setChatMessages(snap.chatMessages);
      if (Array.isArray(snap.announcements)) setAnnouncements(snap.announcements);
      if (Array.isArray(snap.gallery)) setGallery(snap.gallery);
      if (Array.isArray(snap.notifications)) setNotifications(snap.notifications);
      markEdited(ALL_SNAPSHOT_KEYS, 'Restore Backup JSON', { replaceKeys: ALL_SNAPSHOT_KEYS });
      return {
        success: true,
        message: 'Backup data berhasil dimuat & sedang disimpan otomatis ke server!'
      };
    } catch {
      return { success: false, message: 'File JSON rusak atau tidak dapat dibaca.' };
    }
  };

  useEffect(() => {
    let isMounted = true;
    let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let wsHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let wsPongTimeout: ReturnType<typeof setTimeout> | null = null;
    let wsReconnectAttempt = 0;

    const clearWsHeartbeat = () => {
      if (wsHeartbeatTimer) {
        clearInterval(wsHeartbeatTimer);
        wsHeartbeatTimer = null;
      }
      if (wsPongTimeout) {
        clearTimeout(wsPongTimeout);
        wsPongTimeout = null;
      }
    };

    const bootstrapServerIfNeeded = async () => {
      if (
        !isMounted ||
        hasSeededEmptyServerRef.current ||
        isBootstrappingServerRef.current
      ) {
        return;
      }
      isBootstrappingServerRef.current = true;
      try {
        const res = await fetch('/api/bootstrap', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': clientIdRef.current
          },
          body: JSON.stringify({
            snapshot: buildSnapshotFromState(stateRef.current),
            savedBy: isAuthenticatedRef.current
              ? `${stateRef.current.currentUser.name} (@${stateRef.current.currentUser.username})`
              : 'Inisialisasi Portal Otomatis',
            clientId: clientIdRef.current
          })
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          success: boolean;
          bootstrapped?: boolean;
          meta?: PublishMeta;
          snapshot?: AppSnapshot | null;
        };
        if (!isMounted || !data.success || !data.meta) return;
        hasSeededEmptyServerRef.current = true;
        setServerReachable(true);
        syncMetaDisplay(data.meta);
        if (
          data.snapshot &&
          data.meta.hasPublishedSnapshot &&
          !data.bootstrapped &&
          dirtyKeysRef.current.size === 0 &&
          inFlightKeysRef.current.size === 0 &&
          !isFlushingRef.current
        ) {
          applySnapshot(data.snapshot, data.meta.publishedVersion, data.meta.storeId);
        } else if (data.bootstrapped) {
          localPublishedVersionRef.current = data.meta.publishedVersion;
          setLocalPublishedVersion(data.meta.publishedVersion);
          if (data.meta.storeId) setLocalStoreId(data.meta.storeId);
        }
      } catch {
        // ignore transient bootstrap failures; reconnect will retry
      } finally {
        isBootstrappingServerRef.current = false;
      }
    };

    const handleIncomingRealtimePayload = (rawPayload: unknown) => {
      if (!isMounted || !rawPayload || typeof rawPayload !== 'object') return;
      const msg = rawPayload as {
        type?: string;
        meta?: PublishMeta;
        snapshot?: AppSnapshot | null;
        sourceClientId?: string | null;
        actionLabel?: string;
        savedBy?: string;
        timestamp?: string;
        connectedClients?: number;
        publishedVersion?: number;
        hasPublishedSnapshot?: boolean;
      };

      if (typeof msg.connectedClients === 'number') {
        setConnectedClientsCount(Math.max(1, msg.connectedClients));
      }

      if (msg.type === 'pong') {
        if (wsPongTimeout) {
          clearTimeout(wsPongTimeout);
          wsPongTimeout = null;
        }
        setRealtimeConnected(true);
        setServerReachable(true);
        if (
          msg.hasPublishedSnapshot &&
          typeof msg.publishedVersion === 'number' &&
          msg.publishedVersion !== localPublishedVersionRef.current &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          try {
            wsRef.current.send(JSON.stringify({ type: 'sync:request' }));
          } catch {
            // ignore
          }
        }
        return;
      }

      if (msg.type === 'presence:update') {
        return;
      }

      if (msg.type === 'realtime:init' || msg.type === 'snapshot:updated') {
        if (!msg.meta) return;
        setServerReachable(true);
        syncMetaDisplay(msg.meta);

        if (msg.type === 'snapshot:updated' && msg.actionLabel) {
          setLastSyncedEvent({
            version: msg.meta.publishedVersion,
            actionLabel: msg.actionLabel,
            savedBy: msg.savedBy || 'Pengguna Sekolah',
            timestamp: msg.timestamp || new Date().toISOString()
          });
        }

        if (!msg.meta.hasPublishedSnapshot) {
          void bootstrapServerIfNeeded();
          return;
        }

        hasSeededEmptyServerRef.current = true;

        if (
          msg.snapshot &&
          msg.meta.hasPublishedSnapshot &&
          msg.sourceClientId !== clientIdRef.current
        ) {
          if (dirtyKeysRef.current.size === 0 && inFlightKeysRef.current.size === 0 && !isFlushingRef.current) {
            const serverVer = msg.meta.publishedVersion || 0;
            const localVer = localPublishedVersionRef.current;
            const storeChanged = Boolean(
              msg.meta.storeId && localStoreIdRef.current !== msg.meta.storeId
            );
            const shouldApply =
              msg.type === 'snapshot:updated' ||
              storeChanged ||
              serverVer !== localVer;

            if (shouldApply) {
              applySnapshot(msg.snapshot, serverVer, msg.meta.storeId);
              syncMetaDisplay(msg.meta);
            }
          } else {
            pendingRemoteUpdateRef.current = {
              snapshot: msg.snapshot,
              meta: msg.meta
            };
          }
        }
      }
    };

    const closeSseFallback = () => {
      if (sseRef.current) {
        try {
          sseRef.current.close();
        } catch {
          // ignore
        }
        sseRef.current = null;
      }
    };

    const connectSseFallback = () => {
      if (!isMounted || typeof EventSource === 'undefined' || sseRef.current) return;
      try {
        const es = new EventSource(
          `/api/realtime/events?clientId=${encodeURIComponent(clientIdRef.current)}`
        );
        sseRef.current = es;
        es.onopen = () => {
          if (!isMounted) return;
          setRealtimeConnected(true);
          setServerReachable(true);
        };
        es.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            handleIncomingRealtimePayload(parsed);
          } catch {
            // ignore keepalive/malformed SSE frames
          }
        };
        es.onerror = () => {
          if (!isMounted) return;
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setRealtimeConnected(false);
          }
        };
      } catch {
        // ignore SSE init errors
      }
    };

    const startWsHeartbeat = (ws: WebSocket) => {
      clearWsHeartbeat();
      wsHeartbeatTimer = setInterval(() => {
        if (!isMounted || wsRef.current !== ws || ws.readyState !== WebSocket.OPEN) {
          return;
        }
        try {
          ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
          if (wsPongTimeout) clearTimeout(wsPongTimeout);
          wsPongTimeout = setTimeout(() => {
            wsPongTimeout = null;
            if (!isMounted || wsRef.current !== ws) return;
            try {
              ws.close();
            } catch {
              // ignore
            }
          }, 8000);
        } catch {
          try {
            ws.close();
          } catch {
            // ignore
          }
        }
      }, 20_000);
    };

    const connectWebSocket = () => {
      if (!isMounted || typeof window === 'undefined' || typeof WebSocket === 'undefined') {
        connectSseFallback();
        return;
      }
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/realtime?clientId=${encodeURIComponent(
          clientIdRef.current
        )}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) {
            ws.close();
            return;
          }
          wsReconnectAttempt = 0;
          setRealtimeConnected(true);
          setServerReachable(true);
          closeSseFallback();
          startWsHeartbeat(ws);
          try {
            ws.send(JSON.stringify({ type: 'sync:request' }));
          } catch {
            // ignore
          }
          if (dirtyKeysRef.current.size > 0 && !isFlushingRef.current) {
            void flushAutoSave();
          }
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(String(event.data));
            handleIncomingRealtimePayload(parsed);
          } catch {
            // ignore malformed WS frames
          }
        };

        ws.onerror = () => {
          if (!isMounted) return;
          connectSseFallback();
        };

        ws.onclose = () => {
          clearWsHeartbeat();
          if (wsRef.current === ws) {
            wsRef.current = null;
          }
          if (!isMounted) return;
          setRealtimeConnected(Boolean(sseRef.current && sseRef.current.readyState === EventSource.OPEN));
          connectSseFallback();

          if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
          const delay = Math.min(5000, 1000 * Math.pow(1.5, wsReconnectAttempt));
          wsReconnectAttempt++;
          wsReconnectTimer = setTimeout(() => {
            wsReconnectTimer = null;
            connectWebSocket();
          }, delay);
        };
      } catch {
        connectSseFallback();
      }
    };

    const syncStatus = async () => {
      try {
        if (dirtyKeysRef.current.size > 0 && !isFlushingRef.current) {
          await flushAutoSave();
        }
        const res = await fetch('/api/publish/status', {
          credentials: 'same-origin',
          cache: 'no-store'
        });
        if (!res.ok) return;
        const data = (await res.json()) as { success: boolean; meta?: PublishMeta };
        if (!isMounted || !data.meta) return;
        setServerReachable(true);
        syncMetaDisplay(data.meta);

        if (!data.meta.hasPublishedSnapshot) {
          await bootstrapServerIfNeeded();
          return;
        }

        hasSeededEmptyServerRef.current = true;

        const serverVer = data.meta.publishedVersion;
        const localVer = localPublishedVersionRef.current;
        const storeChanged = Boolean(
          data.meta.storeId && localStoreIdRef.current !== data.meta.storeId
        );
        const shouldPull =
          data.meta.hasPublishedSnapshot &&
          dirtyKeysRef.current.size === 0 &&
          inFlightKeysRef.current.size === 0 &&
          !isFlushingRef.current &&
          (storeChanged || serverVer !== localVer);

        if (shouldPull) {
          const snapRes = await fetch('/api/publish/snapshot', {
            credentials: 'same-origin',
            cache: 'no-store'
          });
          if (!snapRes.ok) return;
          const snapData = (await snapRes.json()) as {
            meta: PublishMeta;
            snapshot: AppSnapshot | null;
          };
          if (
            isMounted &&
            snapData.snapshot &&
            snapData.meta &&
            dirtyKeysRef.current.size === 0 &&
            inFlightKeysRef.current.size === 0 &&
            !isFlushingRef.current
          ) {
            applySnapshot(snapData.snapshot, snapData.meta.publishedVersion, snapData.meta.storeId);
            syncMetaDisplay(snapData.meta);
          }
        }
      } catch {
        if (isMounted) setServerReachable(false);
      }
    };

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        broadcastRef.current = new BroadcastChannel('tk_mishbah_autosync');
        broadcastRef.current.onmessage = (event) => {
          const payload = event.data as { type?: string; version?: number } | undefined;
          if (payload?.type === 'synced' && (payload.version || 0) > localPublishedVersionRef.current) {
            void syncStatus();
          }
        };
      }
    } catch {
      // ignore BroadcastChannel setup failures
    }

    connectWebSocket();
    void syncStatus();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'hidden') {
        if (dirtyKeysRef.current.size > 0) {
          void flushAutoSave(true);
        }
      } else {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
            wsRef.current.send(JSON.stringify({ type: 'sync:request' }));
          } catch {
            connectWebSocket();
            void syncStatus();
          }
        } else {
          connectWebSocket();
          void syncStatus();
        }
      }
    };

    const handleOnline = () => {
      connectWebSocket();
      void syncStatus();
    };

    const handlePageHide = () => {
      if (dirtyKeysRef.current.size > 0) {
        void flushAutoSave(true);
      }
    };

    const handlePageShow = () => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        connectWebSocket();
      } else {
        try {
          wsRef.current.send(JSON.stringify({ type: 'sync:request' }));
        } catch {
          connectWebSocket();
        }
      }
      void syncStatus();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      isMounted = false;
      clearWsHeartbeat();
      if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
      closeSseFallback();
      try {
        broadcastRef.current?.close();
      } catch {
        // ignore
      }
    };
  }, []);

  const hasRemoteUpdate =
    publishMeta.hasPublishedSnapshot &&
    (publishMeta.publishedVersion !== localPublishedVersion ||
      (Boolean(publishMeta.storeId) && localStoreIdRef.current !== publishMeta.storeId));

  // Auth functions
  const login = (username: string, password?: string): boolean => {
    const cleanInput = username.trim().toLowerCase();
    const cleanPass = password ?? '';
    if (!cleanInput || !cleanPass) return false;

    const found = users.find(
      (u) =>
        u.username.toLowerCase() === cleanInput ||
        u.name.toLowerCase() === cleanInput ||
        (u.email && u.email.toLowerCase() === cleanInput)
    );

    if (found && (found.password || 'password123') === cleanPass) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      addNotification({
        title: 'Berhasil Masuk',
        message: `Selamat datang kembali, ${found.name} (@${found.username})`,
        type: 'info',
        forRole: found.role
      });
      return true;
    }
    return false;
  };

  const loginWithSync = async (username: string, password?: string): Promise<boolean> => {
    if (login(username, password)) {
      return true;
    }
    const cleanInput = username.trim().toLowerCase();
    const cleanPass = password ?? '';
    if (!cleanInput || !cleanPass) return false;

    try {
      const res = await fetch('/api/publish/snapshot', {
        credentials: 'same-origin',
        cache: 'no-store'
      });
      if (!res.ok) return false;
      const data = (await res.json()) as {
        meta?: PublishMeta;
        snapshot?: AppSnapshot | null;
      };
      if (data.snapshot && data.meta?.hasPublishedSnapshot) {
        applySnapshot(data.snapshot, data.meta.publishedVersion, data.meta.storeId);
        syncMetaDisplay(data.meta);
        const latestUsers = Array.isArray(data.snapshot.users)
          ? deduplicateUsersById(
              data.snapshot.users.map((u) => ({
                ...u,
                password: u.password || 'password123'
              }))
            )
          : stateRef.current.users;
        const found = latestUsers.find(
          (u) =>
            u.username.toLowerCase() === cleanInput ||
            u.name.toLowerCase() === cleanInput ||
            (u.email && u.email.toLowerCase() === cleanInput)
        );
        if (found && (found.password || 'password123') === cleanPass) {
          setCurrentUser(found);
          setIsAuthenticated(true);
          addNotification({
            title: 'Berhasil Masuk',
            message: `Selamat datang kembali, ${found.name} (@${found.username})`,
            type: 'info',
            forRole: found.role
          });
          return true;
        }
      }
    } catch {
      // ignore network error during login fallback
    }
    return false;
  };

  const quickSwitchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const getUserForTeacher = (teacherId: string): User | undefined =>
    users.find((u) => u.relatedTeacherId === teacherId || u.id === `user-${teacherId}`);

  const getUserForStaff = (staffId: string): User | undefined =>
    users.find((u) => u.relatedStaffId === staffId || u.id === `user-${staffId}`);

  const getUserForStudent = (studentId: string): User | undefined =>
    users.find((u) => u.relatedStudentId === studentId || u.id === `user-ortu-${studentId}`);

  const changeOwnPassword = (
    oldPassword: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    const storedUser = users.find((u) => u.id === currentUser.id) || currentUser;
    const currentExpected = storedUser.password || 'password123';
    if (oldPassword !== currentExpected) {
      return { success: false, message: 'Kata sandi lama tidak sesuai.' };
    }
    if (newPassword.trim().length < 4) {
      return { success: false, message: 'Kata sandi baru minimal 4 karakter.' };
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, password: newPassword } : u))
    );
    setCurrentUser((prev) => ({ ...prev, password: newPassword }));
    addNotification({
      title: '🔐 Kata Sandi Diperbarui',
      message: `Kata sandi akun @${currentUser.username} berhasil diperbarui.`,
      type: 'success',
      forRole: currentUser.role
    });
    markEdited(['users', 'notifications'], 'Pembaruan Kata Sandi');
    return { success: true, message: 'Kata sandi berhasil diperbarui!' };
  };

  const updateUserCredentials = (
    userId: string,
    username: string,
    password?: string
  ): { success: boolean; message: string } => {
    if (!isAccountOwner) {
      return { success: false, message: 'Hanya Pemilik Akun yang dapat mengubah kredensial pengguna.' };
    }
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '.');
    if (!cleanUsername) {
      return { success: false, message: 'Username tidak boleh kosong.' };
    }
    const isDuplicate = users.some(
      (u) => u.id !== userId && u.username.toLowerCase() === cleanUsername
    );
    if (isDuplicate) {
      return { success: false, message: `Username "${cleanUsername}" sudah digunakan akun lain.` };
    }
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const updated: User = {
          ...u,
          username: cleanUsername,
          ...(password && password.trim() ? { password: password.trim() } : {})
        };
        if (currentUser.id === userId) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );
    markEdited(['users'], 'Pembaruan Kredensial Akun');
    return { success: true, message: 'Kredensial akun berhasil disimpan.' };
  };

  const updateUserAvatar = (userId: string, newAvatarUrl: string) => {
    if (!isAccountOwner && currentUser.id !== userId) {
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, avatarUrl: newAvatarUrl } : u))
    );
    setCurrentUser((prev) => (prev.id === userId ? { ...prev, avatarUrl: newAvatarUrl } : prev));
    markEdited(['users'], 'Pembaruan Foto Profil');
  };

  const updateOwnerUser = (updatedData: Partial<User>) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Penggantian data pemilik akun hanya dapat dilakukan oleh Pemilik Akun.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }

    setUsers((prev) => {
      const ownerIndex = prev.findIndex((u) => u.isOwner || u.role === 'owner' || u.id === 'user-owner');
      if (ownerIndex !== -1) {
        const copy = [...prev];
        const currentOwner = copy[ownerIndex];
        const updatedOwner: User = {
          ...currentOwner,
          ...updatedData,
          isOwner: true,
          role: 'owner'
        };
        copy[ownerIndex] = updatedOwner;

        if (currentUser.id === currentOwner.id || currentUser.isOwner) {
          setCurrentUser(updatedOwner);
        }
        return copy;
      } else {
        const newOwner: User = {
          id: 'user-owner',
          username: updatedData.username || 'pemilik.akun',
          name: updatedData.name || 'Pemilik Baru',
          role: 'owner',
          isOwner: true,
          avatarUrl: updatedData.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
          email: updatedData.email || 'pemilik@tk-almishbah.sch.id',
          phone: updatedData.phone || '0812-0000-0000',
          position: updatedData.position || 'Pemilik Akun & Pembina Lembaga',
          ...updatedData
        };
        if (currentUser.isOwner) {
          setCurrentUser(newOwner);
        }
        return [newOwner, ...prev];
      }
    });

    addNotification({
      title: '👑 Pemilik Akun Berhasil Diperbarui',
      message: `Data kepemilikan akun lembaga telah dialihkan/diperbarui kepada ${updatedData.name || 'Pemilik Baru'}.`,
      type: 'success',
      forRole: 'all',
      linkTab: 'school-profile'
    });
    markEdited(['users', 'notifications'], 'Pembaruan Pemilik Akun');
  };

  // Student CRUD (Hanya Pemilik Akun)
  const addStudent = (newStd: Omit<Student, 'id' | 'barcode'>) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Hanya Pemilik Akun yang dapat menambah data santri.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }
    const nextNum = students.length + 1;
    const id = `TK-AM-20240${nextNum}`;
    const fullStudent: Student = {
      ...newStd,
      id,
      barcode: id
    };
    setStudents((prev) => [fullStudent, ...prev]);

    // Otomatis buat akun login Wali Murid untuk santri baru
    setUsers((prevUsers) => {
      if (prevUsers.some((u) => u.relatedStudentId === fullStudent.id)) return prevUsers;
      const childFirst = (fullStudent.nickName || fullStudent.name.split(' ')[0] || 'santri')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const username = generateUniqueUsername(`ortu.${childFirst}`, prevUsers);
      return [
        ...prevUsers,
        {
          id: `user-ortu-${fullStudent.id}`,
          username,
          password: 'password123',
          name: `${fullStudent.parentName} (Wali ${fullStudent.nickName || fullStudent.name.split(' ')[0]})`,
          role: 'ortu',
          relatedStudentId: fullStudent.id,
          avatarUrl: fullStudent.photoUrl || SCHOOL_ASSETS.logo,
          email: fullStudent.parentEmail,
          phone: fullStudent.parentPhone,
          position: `Wali Murid ${fullStudent.className}`
        }
      ];
    });

    // Otomatis hubungkan ke Presensi Siswa Hari Ini
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toTimeString().split(' ')[0];
    setStudentAttendance((prevAtt) => {
      const alreadyHasToday = prevAtt.some((a) => a.studentId === fullStudent.id && a.date === today);
      if (!alreadyHasToday) {
        return [
          {
            id: `att-s-${fullStudent.id}-${today}`,
            date: today,
            time: timeNow,
            studentId: fullStudent.id,
            studentName: fullStudent.name,
            className: fullStudent.className,
            status: 'Hadir',
            method: 'Manual Guru',
            notes: `Santri baru (${fullStudent.halaqohGroup})`,
            location: {
              lat: schoolProfile.schoolCoordinates.lat,
              lng: schoolProfile.schoolCoordinates.lng,
              distanceMeters: 10,
              inRadius: true
            }
          },
          ...prevAtt
        ];
      }
      return prevAtt;
    });

    addNotification({
      title: 'Santri Baru Terdaftar',
      message: `Ananda ${fullStudent.name} (${fullStudent.className}) berhasil didaftarkan ke pangkalan data sekolah & terhubung ke presensi.`,
      type: 'success',
      forRole: 'all',
      linkTab: 'master-data'
    });
    markEdited(['students', 'users', 'studentAttendance', 'notifications'], 'Tambah Data Santri');
  };

  const updateStudent = (updatedStd: Student) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Hanya Pemilik Akun yang dapat mengubah data santri.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }
    setStudents((prev) => prev.map((s) => (s.id === updatedStd.id ? updatedStd : s)));
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.relatedStudentId === updatedStd.id
          ? {
              ...u,
              name: `${updatedStd.parentName} (Wali ${updatedStd.nickName || updatedStd.name.split(' ')[0]})`,
              email: updatedStd.parentEmail || u.email,
              phone: updatedStd.parentPhone || u.phone,
              position: `Wali Murid ${updatedStd.className}`
            }
          : u
      )
    );
    addNotification({
      title: 'Data Santri Diperbarui',
      message: `Data ananda ${updatedStd.name} (${updatedStd.className}) berhasil disimpan.`,
      type: 'success',
      forRole: 'all',
      linkTab: 'master-data'
    });
    markEdited(['students', 'users', 'notifications'], 'Update Data Santri');
  };

  const deleteStudent = (studentId: string) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Hanya Pemilik Akun yang dapat menghapus data santri.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }
    const target = students.find((s) => s.id === studentId);
    const deletedUserIds = users
      .filter((u) => u.relatedStudentId === studentId)
      .map((u) => u.id);
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setUsers((prev) => prev.filter((u) => u.relatedStudentId !== studentId));
    if (target) {
      addNotification({
        title: 'Data Santri Dihapus',
        message: `Data santri ${target.name} berhasil dihapus dari sistem.`,
        type: 'info',
        forRole: 'all',
        linkTab: 'master-data'
      });
    }
    markEdited(['students', 'users', 'notifications'], 'Hapus Data Santri', {
      deletedIds: { students: [studentId], users: deletedUserIds }
    });
  };

  const deleteStudentsBatch = (studentIds: string[]) => {
    if (!canManageMasterData || studentIds.length === 0) return;
    const idSet = new Set(studentIds);
    const deletedUserIds = users
      .filter((u) => u.relatedStudentId && idSet.has(u.relatedStudentId))
      .map((u) => u.id);
    setStudents((prev) => prev.filter((s) => !idSet.has(s.id)));
    setUsers((prev) => prev.filter((u) => !u.relatedStudentId || !idSet.has(u.relatedStudentId)));
    addNotification({
      title: 'Penghapusan Massal Santri',
      message: `${studentIds.length} data santri berhasil dihapus dari pangkalan data.`,
      type: 'info',
      forRole: 'all',
      linkTab: 'master-data'
    });
    markEdited(['students', 'users', 'notifications'], 'Hapus Massal Santri', {
      deletedIds: { students: studentIds, users: deletedUserIds }
    });
  };

  const updateStudentHalaqoh = (studentId: string, halaqohGroup: string) => {
    if (!canManageMasterData) return;
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, halaqohGroup } : s))
    );
    markEdited(['students'], 'Update Kelompok Halaqoh Santri');
  };

  const batchAssignHalaqoh = (studentIds: string[], halaqohGroup: string) => {
    if (!canManageMasterData) return;
    setStudents((prev) =>
      prev.map((s) => (studentIds.includes(s.id) ? { ...s, halaqohGroup } : s))
    );
    addNotification({
      title: 'Kelompok Halaqoh Diperbarui',
      message: `${studentIds.length} santri berhasil diatur ke ${halaqohGroup}.`,
      type: 'success',
      forRole: 'all',
      linkTab: 'master-data'
    });
    markEdited(['students', 'notifications'], 'Atur Kelompok Halaqoh');
  };

  const addHalaqohGroup = (newGroup: Omit<HalaqohGroupInfo, 'id'>) => {
    if (!canManageMasterData) return;
    const id = `hlq-grp-${Date.now()}`;
    setHalaqohGroups((prev) => [...prev, { ...newGroup, id }]);
    addNotification({
      title: 'Kelompok Halaqoh Baru',
      message: `Kelompok ${newGroup.name} dengan pembimbing ${newGroup.mentorName} berhasil dibuat.`,
      type: 'success',
      forRole: 'all',
      linkTab: 'master-data'
    });
    markEdited(['halaqohGroups', 'notifications'], 'Tambah Kelompok Halaqoh');
  };

  const updateHalaqohGroup = (updatedGroup: HalaqohGroupInfo) => {
    if (!canManageMasterData) return;
    setHalaqohGroups((prev) =>
      prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
    );
    markEdited(['halaqohGroups'], 'Update Kelompok Halaqoh');
  };

  const importStudentsBatch = (
    newRows: Omit<Student, 'id' | 'barcode'>[],
    mode: 'append' | 'replace' | 'upsert' = 'append'
  ): number => {
    if (!canManageMasterData) return 0;
    let affectedCount = 0;
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0];
    let createdOrUpdatedStudents: Student[] = [];

    setStudents((prev) => {
      if (mode === 'replace') {
        const mapped = newRows.map((item, index) => {
          const id = `TK-AM-${202400 + index + 1}`;
          return {
            ...item,
            id,
            barcode: item.nisn || id
          } as Student;
        });
        affectedCount = mapped.length;
        createdOrUpdatedStudents = mapped;
        return mapped;
      }

      if (mode === 'upsert') {
        const updatedList = [...prev];
        const affected: Student[] = [];
        newRows.forEach((item, index) => {
          const existingIdx = updatedList.findIndex(
            (s) =>
              (item.nisn && s.nisn === item.nisn) ||
              s.name.trim().toLowerCase() === item.name.trim().toLowerCase()
          );
          if (existingIdx !== -1) {
            const updated = {
              ...updatedList[existingIdx],
              ...item
            };
            updatedList[existingIdx] = updated;
            affected.push(updated);
            affectedCount++;
          } else {
            const id = `TK-AM-${202400 + updatedList.length + index + 1}`;
            const newlyAdded: Student = {
              ...item,
              id,
              barcode: item.nisn || id
            };
            updatedList.push(newlyAdded);
            affected.push(newlyAdded);
            affectedCount++;
          }
        });
        createdOrUpdatedStudents = affected;
        return updatedList;
      }

      // Default 'append'
      const generated = newRows.map((item, index) => {
        const id = `TK-AM-${202400 + prev.length + index + 1}`;
        return {
          ...item,
          id,
          barcode: item.nisn || id
        } as Student;
      });
      affectedCount = generated.length;
      createdOrUpdatedStudents = generated;
      return [...prev, ...generated];
    });

    // Otomatis hubungkan ke Presensi Siswa Hari Ini & aktifkan barcode
    if (createdOrUpdatedStudents.length > 0) {
      setStudentAttendance((prevAtt) => {
        const newAttRecords: StudentAttendanceRecord[] = [];
        createdOrUpdatedStudents.forEach((student) => {
          const alreadyHasToday = prevAtt.some((a) => a.studentId === student.id && a.date === today);
          if (!alreadyHasToday) {
            newAttRecords.push({
              id: `att-s-${student.id}-${today}`,
              date: today,
              time: nowTime,
              studentId: student.id,
              studentName: student.name,
              className: student.className,
              status: 'Hadir',
              method: 'Manual Guru',
              notes: `Terhubung otomatis dari import Excel (Kelompok ${student.halaqohGroup})`,
              location: {
                lat: schoolProfile.schoolCoordinates.lat,
                lng: schoolProfile.schoolCoordinates.lng,
                distanceMeters: 10,
                inRadius: true
              }
            });
          }
        });
        return [...newAttRecords, ...prevAtt];
      });

      // Otomatis buatkan akun login Wali Murid untuk santri hasil import
      setUsers((prevUsers) => {
        const nextUsers = [...prevUsers];
        createdOrUpdatedStudents.forEach((student) => {
          if (!nextUsers.some((u) => u.relatedStudentId === student.id)) {
            const childFirst = (student.nickName || student.name.split(' ')[0] || 'santri')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '');
            const username = generateUniqueUsername(`ortu.${childFirst}`, nextUsers);
            nextUsers.push({
              id: `user-ortu-${student.id}`,
              username,
              password: 'password123',
              name: `${student.parentName} (Wali ${student.nickName || student.name.split(' ')[0]})`,
              role: 'ortu',
              relatedStudentId: student.id,
              avatarUrl: student.photoUrl || SCHOOL_ASSETS.logo,
              email: student.parentEmail,
              phone: student.parentPhone,
              position: `Wali Murid ${student.className}`
            });
          }
        });
        return nextUsers;
      });
    }

    addNotification({
      title: 'Import & Sinkronisasi Presensi Berhasil',
      message: `${newRows.length} data santri berhasil diimpor otomatis dari Excel (${mode}), langsung terhubung ke presensi hari ini dan siap scan barcode.`,
      type: 'success',
      forRole: 'all',
      linkTab: 'student-att'
    });
    markEdited(['students', 'studentAttendance', 'users', 'notifications'], 'Import Data Santri', {
      replaceKeys: mode === 'replace' ? ['students'] : undefined
    });

    return affectedCount;
  };

  // Teacher CRUD (Hanya Pemilik Akun)
  const addTeacher = (
    newTch: Omit<Teacher, 'id'>,
    credentials?: { username?: string; password?: string }
  ) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Hanya Pemilik Akun yang dapat menambah data guru.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }
    const id = `tch-${Date.now()}`;
    const fullTeacher: Teacher = { ...newTch, id };
    setTeachers((prev) => [...prev, fullTeacher]);

    const role = mapDutyToUserRole(newTch.assignedDuty, 'guru');
    const cleanRequestedUsername = credentials?.username?.trim().toLowerCase().replace(/\s+/g, '.');
    const finalUsername =
      cleanRequestedUsername &&
      !users.some((u) => u.username.toLowerCase() === cleanRequestedUsername)
        ? cleanRequestedUsername
        : generateUniqueUsername(newTch.name, users);
    const finalPassword = credentials?.password?.trim() || 'password123';

    const linkedUser: User = {
      id: `user-${id}`,
      username: finalUsername,
      password: finalPassword,
      name: newTch.name,
      role,
      isPrincipal: role === 'kepala_sekolah',
      relatedTeacherId: id,
      avatarUrl: newTch.photoUrl,
      email: newTch.email,
      phone: newTch.phone,
      position: newTch.position
    };
    setUsers((prev) => [...prev, linkedUser]);

    addNotification({
      title: 'Akun Guru Baru Dibuat',
      message: `${newTch.name} terdaftar dengan username @${finalUsername}.`,
      type: 'success',
      forRole: 'all',
      linkTab: 'master-data'
    });
    markEdited(['teachers', 'users', 'notifications'], 'Tambah Data Guru');
  };

  const updateTeacher = (
    updatedTch: Teacher,
    credentials?: { username?: string; password?: string }
  ) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Hanya Pemilik Akun yang dapat mengubah data pendidik.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }
    setTeachers((prev) => prev.map((t) => (t.id === updatedTch.id ? updatedTch : t)));

    const role = mapDutyToUserRole(updatedTch.assignedDuty, 'guru');
    setUsers((prev) => {
      const idx = prev.findIndex(
        (u) => u.relatedTeacherId === updatedTch.id || u.id === `user-${updatedTch.id}`
      );
      if (idx !== -1) {
        const existing = prev[idx];
        const reqUsername = credentials?.username?.trim().toLowerCase().replace(/\s+/g, '.');
        const canUseReqUsername =
          reqUsername &&
          !prev.some((u) => u.id !== existing.id && u.username.toLowerCase() === reqUsername);
        const updatedUser: User = {
          ...existing,
          name: updatedTch.name,
          avatarUrl: updatedTch.photoUrl,
          email: updatedTch.email,
          phone: updatedTch.phone,
          position: updatedTch.position,
          role: existing.isOwner ? 'owner' : role,
          isPrincipal: role === 'kepala_sekolah',
          username: canUseReqUsername ? reqUsername! : existing.username,
          password:
            credentials?.password && credentials.password.trim()
              ? credentials.password.trim()
              : existing.password || 'password123'
        };
        if (currentUser.id === existing.id) {
          setCurrentUser(updatedUser);
        }
        const copy = [...prev];
        copy[idx] = updatedUser;
        return copy;
      } else {
        const newUsername =
          credentials?.username?.trim().toLowerCase().replace(/\s+/g, '.') ||
          generateUniqueUsername(updatedTch.name, prev);
        const newUser: User = {
          id: `user-${updatedTch.id}`,
          username: newUsername,
          password: credentials?.password?.trim() || 'password123',
          name: updatedTch.name,
          role,
          isPrincipal: role === 'kepala_sekolah',
          relatedTeacherId: updatedTch.id,
          avatarUrl: updatedTch.photoUrl,
          email: updatedTch.email,
          phone: updatedTch.phone,
          position: updatedTch.position
        };
        return [...prev, newUser];
      }
    });
    addNotification({
      title: 'Data Guru Diperbarui',
      message: `Data pendidik ${updatedTch.name} berhasil disimpan.`,
      type: 'success',
      forRole: 'all',
      linkTab: 'master-data'
    });
    markEdited(['teachers', 'users', 'notifications'], 'Update Data Guru');
  };

  const deleteTeacher = (teacherId: string) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Hanya Pemilik Akun yang dapat menghapus data guru.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }
    const target = teachers.find((t) => t.id === teacherId);
    const deletedUserIds = users
      .filter((u) => u.relatedTeacherId === teacherId || u.id === `user-${teacherId}`)
      .map((u) => u.id);
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    setUsers((prev) =>
      prev.filter((u) => u.relatedTeacherId !== teacherId && u.id !== `user-${teacherId}`)
    );
    if (target) {
      addNotification({
        title: 'Data Guru Dihapus',
        message: `Data pendidik ${target.name} dan akun loginnya berhasil dihapus.`,
        type: 'info',
        forRole: 'all',
        linkTab: 'master-data'
      });
    }
    markEdited(['teachers', 'users', 'notifications'], 'Hapus Data Guru', {
      deletedIds: { teachers: [teacherId], users: deletedUserIds }
    });
  };

  const deleteTeachersBatch = (teacherIds: string[]) => {
    if (!canManageMasterData || teacherIds.length === 0) return;
    const idSet = new Set(teacherIds);
    const deletedUserIds = users
      .filter(
        (u) =>
          (u.relatedTeacherId && idSet.has(u.relatedTeacherId)) ||
          teacherIds.some((tid) => u.id === `user-${tid}`)
      )
      .map((u) => u.id);
    setTeachers((prev) => prev.filter((t) => !idSet.has(t.id)));
    setUsers((prev) =>
      prev.filter(
        (u) =>
          !(u.relatedTeacherId && idSet.has(u.relatedTeacherId)) &&
          !teacherIds.some((tid) => u.id === `user-${tid}`)
      )
    );
    addNotification({
      title: 'Penghapusan Massal Guru',
      message: `${teacherIds.length} data guru berhasil dihapus dari sistem.`,
      type: 'info',
      forRole: 'all',
      linkTab: 'master-data'
    });
    markEdited(['teachers', 'users', 'notifications'], 'Hapus Massal Guru', {
      deletedIds: { teachers: teacherIds, users: deletedUserIds }
    });
  };

  const importTeachersBatch = (
    newRows: Omit<Teacher, 'id'>[],
    mode: 'append' | 'replace' | 'upsert' = 'append'
  ): number => {
    if (!canManageMasterData) return 0;
    let affectedCount = 0;
    let importedTeachersList: Teacher[] = [];

    setTeachers((prev) => {
      if (mode === 'replace') {
        const mapped = newRows.map((item, index) => {
          const id = `tch-${Date.now()}-${index}`;
          return { ...item, id } as Teacher;
        });
        affectedCount = mapped.length;
        importedTeachersList = mapped;
        return mapped;
      }

      if (mode === 'upsert') {
        const updatedList = [...prev];
        const affected: Teacher[] = [];
        newRows.forEach((item, index) => {
          const existingIdx = updatedList.findIndex(
            (t) =>
              (item.nuptk && t.nuptk === item.nuptk) ||
              t.name.trim().toLowerCase() === item.name.trim().toLowerCase()
          );
          if (existingIdx !== -1) {
            const updated = {
              ...updatedList[existingIdx],
              ...item
            };
            updatedList[existingIdx] = updated;
            affected.push(updated);
            affectedCount++;
          } else {
            const id = `tch-${Date.now()}-${index}`;
            const created = { ...item, id };
            updatedList.push(created);
            affected.push(created);
            affectedCount++;
          }
        });
        importedTeachersList = affected;
        return updatedList;
      }

      // Default 'append'
      const generated = newRows.map((item, index) => {
        const id = `tch-${Date.now()}-${index}`;
        return { ...item, id } as Teacher;
      });
      affectedCount = generated.length;
      importedTeachersList = generated;
      return [...prev, ...generated];
    });

    if (importedTeachersList.length > 0) {
      setUsers((prevUsers) => {
        const nextUsers = [...prevUsers];
        importedTeachersList.forEach((tch) => {
          const existsIdx = nextUsers.findIndex((u) => u.relatedTeacherId === tch.id);
          const role = mapDutyToUserRole(tch.assignedDuty, 'guru');
          if (existsIdx !== -1) {
            nextUsers[existsIdx] = {
              ...nextUsers[existsIdx],
              name: tch.name,
              avatarUrl: tch.photoUrl,
              email: tch.email,
              phone: tch.phone,
              position: tch.position,
              role
            };
          } else {
            nextUsers.push({
              id: `user-${tch.id}`,
              username: generateUniqueUsername(tch.name, nextUsers),
              password: 'password123',
              name: tch.name,
              role,
              isPrincipal: role === 'kepala_sekolah',
              relatedTeacherId: tch.id,
              avatarUrl: tch.photoUrl,
              email: tch.email,
              phone: tch.phone,
              position: tch.position
            });
          }
        });
        return nextUsers;
      });
    }

    addNotification({
      title: 'Import Data Guru Berhasil',
      message: `${newRows.length} data guru/ustadzah berhasil diimpor otomatis beserta akun login masing-masing (${mode}).`,
      type: 'success',
      forRole: 'all',
      linkTab: 'master-data'
    });
    markEdited(['teachers', 'users', 'notifications'], 'Import Data Guru', {
      replaceKeys: mode === 'replace' ? ['teachers'] : undefined
    });

    return affectedCount;
  };

  // Staff CRUD (Hanya Pemilik Akun)
  const addStaff = (
    newStaff: Omit<Staff, 'id'>,
    credentials?: { username?: string; password?: string }
  ) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Penambahan pegawai baru hanya dapat dilakukan oleh Pemilik Akun.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }
    const id = `stf-${Date.now()}`;
    setStaff((prev) => [...prev, { ...newStaff, id }]);

    const role = mapDutyToUserRole(newStaff.assignedDuty, 'pegawai');
    const cleanRequestedUsername = credentials?.username?.trim().toLowerCase().replace(/\s+/g, '.');
    const finalUsername =
      cleanRequestedUsername &&
      !users.some((u) => u.username.toLowerCase() === cleanRequestedUsername)
        ? cleanRequestedUsername
        : generateUniqueUsername(newStaff.name, users);
    const finalPassword = credentials?.password?.trim() || 'password123';

    const linkedUser: User = {
      id: `user-${id}`,
      username: finalUsername,
      password: finalPassword,
      name: newStaff.name,
      role,
      isPrincipal: role === 'kepala_sekolah',
      relatedStaffId: id,
      avatarUrl: newStaff.photoUrl,
      phone: newStaff.phone,
      position: newStaff.position || newStaff.department
    };
    setUsers((prev) => [...prev, linkedUser]);

    addNotification({
      title: 'Akun Pegawai Baru Dibuat',
      message: `${newStaff.name} terdaftar dengan username @${finalUsername}.`,
      type: 'success',
      forRole: 'all',
      linkTab: 'master-data'
    });
    markEdited(['staff', 'users', 'notifications'], 'Tambah Data Karyawan');
  };

  const updateStaff = (
    updatedStaff: Staff,
    credentials?: { username?: string; password?: string }
  ) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Pengeditan data pegawai hanya dapat dilakukan oleh Pemilik Akun.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }
    setStaff((prev) => prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s)));

    const role = mapDutyToUserRole(updatedStaff.assignedDuty, 'pegawai');
    setUsers((prev) => {
      const idx = prev.findIndex(
        (u) => u.relatedStaffId === updatedStaff.id || u.id === `user-${updatedStaff.id}`
      );
      if (idx !== -1) {
        const existing = prev[idx];
        const reqUsername = credentials?.username?.trim().toLowerCase().replace(/\s+/g, '.');
        const canUseReqUsername =
          reqUsername &&
          !prev.some((u) => u.id !== existing.id && u.username.toLowerCase() === reqUsername);
        const updatedUser: User = {
          ...existing,
          name: updatedStaff.name,
          avatarUrl: updatedStaff.photoUrl,
          phone: updatedStaff.phone,
          position: updatedStaff.position || updatedStaff.department,
          role: existing.isOwner ? 'owner' : role,
          isPrincipal: role === 'kepala_sekolah',
          username: canUseReqUsername ? reqUsername! : existing.username,
          password:
            credentials?.password && credentials.password.trim()
              ? credentials.password.trim()
              : existing.password || 'password123'
        };
        if (currentUser.id === existing.id) {
          setCurrentUser(updatedUser);
        }
        const copy = [...prev];
        copy[idx] = updatedUser;
        return copy;
      } else {
        const newUsername =
          credentials?.username?.trim().toLowerCase().replace(/\s+/g, '.') ||
          generateUniqueUsername(updatedStaff.name, prev);
        const newUser: User = {
          id: `user-${updatedStaff.id}`,
          username: newUsername,
          password: credentials?.password?.trim() || 'password123',
          name: updatedStaff.name,
          role,
          isPrincipal: role === 'kepala_sekolah',
          relatedStaffId: updatedStaff.id,
          avatarUrl: updatedStaff.photoUrl,
          phone: updatedStaff.phone,
          position: updatedStaff.position || updatedStaff.department
        };
        return [...prev, newUser];
      }
    });
    markEdited(['staff', 'users'], 'Update Data Karyawan');
  };

  const deleteStaff = (staffId: string) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Penghapusan data pegawai hanya dapat dilakukan oleh Pemilik Akun.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }
    const deletedUserIds = users
      .filter((u) => u.relatedStaffId === staffId || u.id === `user-${staffId}`)
      .map((u) => u.id);
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
    setUsers((prev) =>
      prev.filter((u) => u.relatedStaffId !== staffId && u.id !== `user-${staffId}`)
    );
    markEdited(['staff', 'users'], 'Hapus Data Karyawan', {
      deletedIds: { staff: [staffId], users: deletedUserIds }
    });
  };

  // Teacher & Staff Attendance (Operational: Pemilik Akun & Guru/Staf)
  const recordTeacherAttendance = (
    teacherId: string,
    selfieUrl: string,
    locationData: TeacherAttendanceRecord['location'],
    notes?: string
  ) => {
    if (currentUser.role === 'ortu') return;
    const teacher = teachers.find((t) => t.id === teacherId);
    const staffMember = staff.find((s) => s.id === teacherId);
    const personName = teacher?.name || staffMember?.name || currentUser.name;
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    // Cutoff 07:30 WIB
    const hour = now.getHours();
    const minute = now.getMinutes();
    const isLate = hour > 7 || (hour === 7 && minute > 30);
    const status = isLate ? 'Terlambat' : 'Hadir Tepat Waktu';

    const newRecord: TeacherAttendanceRecord = {
      id: `att-t-${Date.now()}`,
      date,
      time,
      teacherId,
      teacherName: personName,
      selfieUrl,
      status,
      notes: notes || (isLate ? 'Hadir lewat batas 07:30 WIB' : 'Presensi pagi tepat waktu'),
      location: locationData
    };

    setTeacherAttendance((prev) => [newRecord, ...prev]);

    addNotification({
      title: 'Presensi Pegawai Tercatat',
      message: `${personName} berhasil melakukan selfie presensi (${status}) pada ${time} WIB.`,
      type: isLate ? 'warning' : 'success',
      forRole: 'all',
      linkTab: 'teacher-att'
    });
    markEdited(['teacherAttendance', 'notifications'], `Presensi ${personName}`);
  };

  const upsertTeacherAttendance = (
    teacherId: string,
    date: string,
    status: TeacherAttendanceRecord['status'],
    notes?: string,
    time?: string
  ) => {
    if (!isAccountOwner) return;
    const teacher = teachers.find((t) => t.id === teacherId);
    const staffMember = staff.find((s) => s.id === teacherId);
    const personName = teacher?.name || staffMember?.name || currentUser.name;
    const personPhoto =
      teacher?.photoUrl ||
      staffMember?.photoUrl ||
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80';

    const defaultTime =
      time ||
      (status === 'Hadir Tepat Waktu'
        ? '07:12:00'
        : status === 'Terlambat'
        ? '07:40:00'
        : '07:00:00');

    const defaultNotes =
      notes !== undefined
        ? notes
        : status === 'Hadir Tepat Waktu'
        ? 'Input/Pembaruan presensi harian oleh pemilik akun'
        : status === 'Terlambat'
        ? 'Tercatat terlambat lewat 07:30 WIB'
        : `${status} (Tercatat pada rekap harian)`;

    setTeacherAttendance((prev) => {
      const idx = prev.findIndex((r) => r.teacherId === teacherId && r.date === date);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          status,
          time: time || updated[idx].time || defaultTime,
          notes: defaultNotes
        };
        return updated;
      }
      const newRecord: TeacherAttendanceRecord = {
        id: `att-t-${Date.now()}-${teacherId}`,
        date,
        time: defaultTime,
        teacherId,
        teacherName: personName,
        selfieUrl: personPhoto,
        status,
        notes: defaultNotes,
        location: {
          lat: schoolProfile.schoolCoordinates.lat,
          lng: schoolProfile.schoolCoordinates.lng,
          accuracy: 10,
          distanceMeters: 10,
          inRadius: true,
          addressDescription: schoolProfile.schoolCoordinates.name || schoolProfile.name
        }
      };
      return [newRecord, ...prev];
    });
    markEdited(['teacherAttendance'], `Update Presensi ${personName}`);
  };

  // Student Attendance (Barcode Scan or Manual - Operational: Guru/Staf & Pemilik Akun)
  const recordStudentAttendance = (
    recordData: Omit<StudentAttendanceRecord, 'id' | 'date' | 'time'>
  ) => {
    if (currentUser.role === 'ortu') {
      return {
        success: false,
        message: 'Akun orang tua murid hanya memiliki akses lihat.'
      };
    }
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    const isLate =
      recordData.status === 'Terlambat' ||
      (!recordData.status && (now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() > 30)));
    const finalStatus = recordData.status || (isLate ? 'Terlambat' : 'Hadir');

    const newRec: StudentAttendanceRecord = {
      ...recordData,
      id: `att-s-${recordData.studentId}-${date}`,
      date,
      time,
      status: finalStatus
    };

    const replacedIds = studentAttendance
      .filter((r) => r.studentId === recordData.studentId && r.date === date && r.id !== newRec.id)
      .map((r) => r.id);

    setStudentAttendance((prev) => {
      const remaining = prev.filter(
        (r) => !(r.studentId === recordData.studentId && r.date === date)
      );
      return [newRec, ...remaining];
    });

    // Trigger Notification to parents & teachers
    if (finalStatus === 'Terlambat') {
      addNotification({
        title: '⚠️ Notifikasi Siswa Terlambat',
        message: `Santri ${recordData.studentName} (${recordData.className}) tiba di sekolah pukul ${time} WIB via ${recordData.method} (Terlambat).`,
        type: 'warning',
        forRole: 'all',
        linkTab: 'student-att'
      });
    } else if (finalStatus === 'Hadir') {
      addNotification({
        title: '✅ Siswa Tiba di Sekolah',
        message: `Santri ${recordData.studentName} (${recordData.className}) telah hadir di sekolah via ${recordData.method} pukul ${time} WIB.`,
        type: 'info',
        forRole: 'ortu',
        linkTab: 'reports'
      });
    } else {
      addNotification({
        title: `📝 Absensi Manual: ${finalStatus}`,
        message: `Santri ${recordData.studentName} (${recordData.className}) dicatat ${finalStatus} via ${recordData.method} pukul ${time} WIB.`,
        type: 'info',
        forRole: 'ortu',
        linkTab: 'reports'
      });
    }

    markEdited(['studentAttendance', 'notifications'], `Absensi Siswa (${recordData.studentName})`, {
      deletedIds: replacedIds.length > 0 ? { studentAttendance: replacedIds } : undefined
    });

    return {
      success: true,
      message: `Presensi ${recordData.studentName} berhasil dicatat (${finalStatus})`,
      record: newRec
    };
  };

  const batchUpdateStudentAttendance = (records: StudentAttendanceRecord[]) => {
    if (currentUser.role === 'ortu') return;
    const replacedIds = studentAttendance
      .filter((p) =>
        records.some((r) => (r.id === p.id || (r.studentId === p.studentId && r.date === p.date)) && r.id !== p.id)
      )
      .map((p) => p.id);

    setStudentAttendance((prev) => {
      const remaining = prev.filter(
        (p) => !records.some((r) => r.id === p.id || (r.studentId === p.studentId && r.date === p.date))
      );
      return [...records, ...remaining];
    });
    markEdited(['studentAttendance'], `Absensi Manual ${records.length} Siswa`, {
      deletedIds: replacedIds.length > 0 ? { studentAttendance: replacedIds } : undefined
    });
  };

  // Halaqoh (Input baru oleh Guru/Staf & Pemilik Akun; Edit riwayat hanya Pemilik Akun)
  const addHalaqohAssessment = (assessmentData: Omit<HalaqohAssessment, 'id' | 'date'>) => {
    if (currentUser.role === 'ortu') return;
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const newAssessment: HalaqohAssessment = {
      ...assessmentData,
      id: `hlq-${Date.now()}`,
      date
    };
    const isIqro =
      assessmentData.category === 'Iqro' ||
      assessmentData.type === 'Membaca Iqro' ||
      assessmentData.type === 'Tilawati/Iqro';

    setHalaqohAssessments((prev) => [newAssessment, ...prev]);

    // Push notification to parents
    addNotification({
      title: isIqro ? '📖 Laporan Membaca Iqro Baru' : '📖 Laporan Halaqoh Tahfidz Baru',
      message: `Ananda ${assessmentData.studentName} telah menyetorkan ${assessmentData.surahOrJilid} dengan predikat ${assessmentData.grade}!`,
      type: 'success',
      forRole: 'ortu',
      linkTab: 'halaqoh'
    });
    markEdited(
      ['halaqohAssessments', 'notifications'],
      isIqro
        ? `Penilaian Iqro (${assessmentData.studentName})`
        : `Penilaian Tahfidz (${assessmentData.studentName})`
    );
  };

  const updateHalaqohAssessment = (updated: HalaqohAssessment) => {
    if (!isAccountOwner) return;
    setHalaqohAssessments((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    markEdited(['halaqohAssessments'], `Update Nilai Halaqoh (${updated.studentName})`);
  };

  // SPP Payment (Ortu tidak dapat melakukan perubahan/aksi SPP)
  const paySppInvoice = (
    invoiceId: string,
    method: SppInvoice['paymentMethod'],
    ref?: string
  ) => {
    if (!isAccountOwner && currentUser.role === 'ortu') return;
    setSppInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            status: 'LUNAS',
            paidDate: new Date().toLocaleString('id-ID'),
            paymentMethod: method,
            transactionRef: ref || `PAY-${Date.now().toString().slice(-6)}`
          };
        }
        return inv;
      })
    );

    addNotification({
      title: 'Pembayaran SPP Berhasil',
      message: `Tagihan SPP ${invoiceId} berhasil dibayar via ${method}. Kuitansi resmi dapat diunduh sekarang.`,
      type: 'success',
      forRole: 'all',
      linkTab: 'spp'
    });
    markEdited(['sppInvoices', 'notifications'], `Pembayaran SPP (${invoiceId})`);
  };

  const verifySppInvoice = (invoiceId: string) => {
    if (!isAccountOwner) return;
    setSppInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'LUNAS' } : inv))
    );
    markEdited(['sppInvoices'], `Verifikasi SPP (${invoiceId})`);
  };

  // Chat (Guru/Staf & Pemilik Akun)
  const sendChatMessage = (
    text: string,
    groupId?: string,
    recipientId?: string,
    attachmentUrl?: string
  ) => {
    if (currentUser.role === 'ortu') return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatarUrl,
      groupId,
      recipientId,
      text,
      timestamp: 'Baru saja',
      attachmentUrl
    };

    setChatMessages((prev) => [...prev, newMsg]);
    markEdited(['chatMessages'], 'Pesan Chat Baru');
  };

  // Announcements (Hanya Pemilik Akun)
  const addAnnouncement = (newAnn: Omit<Announcement, 'id' | 'date'>) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Hanya Pemilik Akun yang dapat membuat pengumuman resmi sekolah.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }
    const date = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    setAnnouncements((prev) => [{ ...newAnn, id: `ann-${Date.now()}`, date }, ...prev]);

    addNotification({
      title: '📢 Pengumuman Baru Sekolah',
      message: `${newAnn.title}`,
      type: 'info',
      forRole: 'all',
      linkTab: 'gallery'
    });
    markEdited(['announcements', 'notifications'], `Pengumuman (${newAnn.title})`);
  };

  // Gallery (Hanya Pemilik Akun)
  const addGalleryItem = (item: Omit<GalleryItem, 'id' | 'date'>) => {
    if (!isAccountOwner) return;
    const date = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    setGallery((prev) => [{ ...item, id: `gal-${Date.now()}`, date }, ...prev]);
    markEdited(['gallery'], `Upload Galeri (${item.title})`);
  };

  // Notifications
  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    markEdited(['notifications'], 'Pembaruan Notifikasi');
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markEdited(['notifications'], 'Pembaruan Notifikasi');
  };

  // School Profile Update (Hanya Pemilik Akun)
  const updateSchoolProfile = (updated: Partial<SchoolProfile>) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Profil dan identitas sekolah hanya dapat diubah oleh Pemilik Akun.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }
    setSchoolProfile((prev) => ({ ...prev, ...updated }));
    addNotification({
      title: 'Profil Sekolah Diperbarui',
      message: 'Identitas, logo, dan motto TK Islam Al Mishbah berhasil diperbarui.',
      type: 'success',
      forRole: 'all',
      linkTab: 'school-profile'
    });
    markEdited(['schoolProfile', 'notifications'], 'Pembaruan Profil Sekolah');
  };

  // Leave & Permits Management (Pengajuan oleh Guru/Staf & Pemilik Akun; ACC/Edit/Hapus hanya Pemilik Akun)
  const submitLeaveRequest = (
    data: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy' | 'reviewNotes'>
  ) => {
    if (currentUser.role === 'ortu') return;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeFormatted = now.toTimeString().split(' ')[0].substring(0, 5);
    const newLeave: LeaveRequest = {
      ...data,
      id: `leave-${Date.now()}`,
      status: 'pending',
      submittedAt: `${dateFormatted} - ${timeFormatted} WIB`
    };

    setLeaveRequests((prev) => [newLeave, ...prev]);

    addNotification({
      title: `📋 Pengajuan ${data.leaveType} Baru: ${data.applicantName}`,
      message: `${data.applicantName} (${data.applicantPosition}) mengajukan perizinan ${data.leaveType} (${data.totalDays} hari). Menunggu ACC Pemilik Akun.`,
      type: 'warning',
      forRole: 'all',
      linkTab: 'teacher-att'
    });
    markEdited(['leaveRequests', 'notifications'], `Pengajuan ${data.leaveType} (${data.applicantName})`);
  };

  const approveLeaveRequest = (leaveId: string, reviewNotes?: string) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Hanya Pemilik Akun yang berwenang memberikan ACC atau mengubah status Izin & Cuti.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }

    const target = leaveRequests.find((l) => l.id === leaveId);
    if (!target) return;

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeFormatted = now.toTimeString().split(' ')[0].substring(0, 5);
    const reviewerName = `${currentUser.name} (Pemilik Akun)`;

    setLeaveRequests((prev) =>
      prev.map((item) =>
        item.id === leaveId
          ? {
              ...item,
              status: 'approved',
              reviewedAt: `${dateFormatted} - ${timeFormatted} WIB`,
              reviewedBy: reviewerName,
              reviewNotes: reviewNotes || 'Disetujui resmi oleh Pemilik Akun.'
            }
          : item
      )
    );

    // Auto-record attendance for today if the approved leave covers today
    const attStatus: TeacherAttendanceRecord['status'] =
      target.leaveType === 'Sakit' ? 'Sakit' : target.leaveType === 'Cuti' ? 'Cuti' : 'Izin';
    const today = now.toISOString().split('T')[0];

    const newAttRecord: TeacherAttendanceRecord = {
      id: `att-leave-${Date.now()}`,
      date: today,
      time: timeFormatted + ':00',
      teacherId: target.applicantId,
      teacherName: target.applicantName,
      selfieUrl: target.doctorLetterUrl || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=300&q=80',
      status: attStatus,
      notes: `ACC Kepala Sekolah: ${target.leaveType} (${target.reason})`,
      location: {
        lat: schoolProfile.schoolCoordinates.lat,
        lng: schoolProfile.schoolCoordinates.lng,
        accuracy: 10,
        distanceMeters: 0,
        inRadius: true,
        addressDescription: `Izin/Cuti Resmi Di-ACC Kepala Sekolah: ${target.reason}`
      }
    };

    const replacedAttIds = teacherAttendance
      .filter((r) => r.teacherId === target.applicantId && r.date === today)
      .map((r) => r.id);

    setTeacherAttendance((prev) => {
      const filtered = prev.filter((r) => !(r.teacherId === target.applicantId && r.date === today));
      return [newAttRecord, ...filtered];
    });

    if (target.leaveType === 'Cuti') {
      if (target.applicantType === 'teacher') {
        setTeachers((prev) =>
          prev.map((t) => (t.id === target.applicantId ? { ...t, status: 'Cuti' as const } : t))
        );
      } else {
        setStaff((prev) =>
          prev.map((s) => (s.id === target.applicantId ? { ...s, status: 'Cuti' as const } : s))
        );
      }
    }

    addNotification({
      title: `✅ Izin/Cuti Di-ACC Kepala Sekolah`,
      message: `Permohonan ${target.leaveType} dari ${target.applicantName} (${target.applicantPosition}) telah disetujui resmi oleh Kepala Sekolah.`,
      type: 'success',
      forRole: 'all',
      linkTab: 'teacher-att'
    });
    markEdited(
      ['leaveRequests', 'teacherAttendance', 'teachers', 'staff', 'notifications'],
      `ACC ${target.leaveType} (${target.applicantName})`,
      { deletedIds: replacedAttIds.length > 0 ? { teacherAttendance: replacedAttIds } : undefined }
    );
  };

  const rejectLeaveRequest = (leaveId: string, reviewNotes?: string) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Hanya Pemilik Akun yang berwenang menolak atau mengubah status perizinan.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }
    const target = leaveRequests.find((l) => l.id === leaveId);
    if (!target) return;

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeFormatted = now.toTimeString().split(' ')[0].substring(0, 5);
    const reviewerName = `${currentUser.name} (Pemilik Akun)`;

    setLeaveRequests((prev) =>
      prev.map((item) =>
        item.id === leaveId
          ? {
              ...item,
              status: 'rejected',
              reviewedAt: `${dateFormatted} - ${timeFormatted} WIB`,
              reviewedBy: reviewerName,
              reviewNotes: reviewNotes || 'Tidak disetujui / ditolak oleh Pemilik Akun.'
            }
          : item
      )
    );

    addNotification({
      title: `❌ Pengajuan Izin/Cuti Ditolak`,
      message: `Permohonan ${target.leaveType} dari ${target.applicantName} tidak disetujui. Catatan: ${reviewNotes || 'Alasan dinas/operasional.'}`,
      type: 'warning',
      forRole: 'all',
      linkTab: 'teacher-att'
    });
    markEdited(['leaveRequests', 'notifications'], `Penolakan Izin (${target.applicantName})`);
  };

  const deleteLeaveRequest = (leaveId: string) => {
    if (!isAccountOwner) {
      addNotification({
        title: 'Akses Ditolak',
        message: 'Penghapusan berkas perizinan hanya dapat dilakukan oleh Pemilik Akun.',
        type: 'warning',
        forRole: currentUser.role
      });
      return;
    }
    setLeaveRequests((prev) => prev.filter((l) => l.id !== leaveId));
    markEdited(['leaveRequests'], 'Hapus Data Izin/Cuti', {
      deletedIds: { leaveRequests: [leaveId] }
    });
  };

  return (
    <AppContext.Provider
      value={{
        schoolProfile,
        updateSchoolProfile,
        currentUser,
        users,
        students,
        teachers,
        staff,
        studentAttendance,
        teacherAttendance,
        halaqohAssessments,
        sppInvoices,
        chatGroups,
        chatMessages,
        announcements,
        gallery,
        notifications,

        // Leave Requests
        leaveRequests,
        submitLeaveRequest,
        approveLeaveRequest,
        rejectLeaveRequest,
        deleteLeaveRequest,

        // Authority & Permission
        isAccountOwner,
        isPrincipal,
        canEditSchoolData,
        canManageMasterData,
        canEditRecord,

        isAuthenticated,
        login,
        loginWithSync,
        quickSwitchUser,
        logout,
        updateUserAvatar,
        changeOwnPassword,
        updateUserCredentials,
        getUserForTeacher,
        getUserForStaff,
        getUserForStudent,

        addStudent,
        updateStudent,
        deleteStudent,
        deleteStudentsBatch,
        importStudentsBatch,

        addTeacher,
        updateTeacher,
        deleteTeacher,
        deleteTeachersBatch,
        importTeachersBatch,

        addStaff,
        updateStaff,
        deleteStaff,

        recordTeacherAttendance,
        upsertTeacherAttendance,
        recordStudentAttendance,
        batchUpdateStudentAttendance,

        // Halaqoh
        halaqohGroups,
        updateStudentHalaqoh,
        batchAssignHalaqoh,
        addHalaqohGroup,
        updateHalaqohGroup,
        addHalaqohAssessment,
        updateHalaqohAssessment,

        paySppInvoice,
        verifySppInvoice,

        sendChatMessage,
        addAnnouncement,
        addGalleryItem,

        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,

        // Owner Management
        updateOwnerUser,

        // Demo Switcher
        showDemoSwitcher,
        setShowDemoSwitcher,
        toggleDemoSwitcher,

        // Update, Auto-Save & Publish
        hasPendingChanges,
        lastEditedAt,
        localPublishedVersion,
        hasRemoteUpdate,
        publishMeta,
        isPublishing,
        isSyncing,
        serverReachable,
        autoSaveStatus,
        lastAutoSavedAt,
        lastActionLabel,
        realtimeConnected,
        connectedClientsCount,
        lastSyncedEvent,
        publishUpdates,
        saveDraftToServer,
        pullLatestPublished,
        exportBackupJson,
        importBackupJson
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
