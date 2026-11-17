import React, { createContext, useContext, useState, useEffect } from 'react';
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
  STAFF_POSITIONS
} from '../types';
import { SCHOOL_ASSETS } from '../assets/images';
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
  canEditRecord: (
    entityType: 'student' | 'teacher' | 'staff' | 'school' | 'halaqoh' | 'user',
    targetId?: string
  ) => boolean;

  // Auth & Switcher
  login: (username: string, password?: string) => boolean;
  quickSwitchUser: (userId: string) => void;
  logout: () => void;
  updateUserAvatar: (userId: string, newAvatarUrl: string) => void;

  // Student CRUD
  addStudent: (student: Omit<Student, 'id' | 'barcode'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (studentId: string) => void;
  importStudentsBatch: (
    students: Omit<Student, 'id' | 'barcode'>[],
    mode?: 'append' | 'replace' | 'upsert'
  ) => number;

  // Teacher CRUD
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (teacher: Teacher) => void;
  deleteTeacher: (teacherId: string) => void;
  importTeachersBatch: (
    teachers: Omit<Teacher, 'id'>[],
    mode?: 'append' | 'replace' | 'upsert'
  ) => number;

  // Staff CRUD
  addStaff: (staffMember: Omit<Staff, 'id'>) => void;
  updateStaff: (staffMember: Staff) => void;
  deleteStaff: (staffId: string) => void;

  // Attendance
  recordTeacherAttendance: (
    teacherId: string,
    selfieUrl: string,
    locationData: TeacherAttendanceRecord['location'],
    notes?: string
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state with fallback to initial data
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure new accounts (pemilik.akun & kepala.sekolah) are merged if missing
        const existingUsernames = new Set(parsed.map((u: User) => u.username));
        const missing = INITIAL_USERS.filter((u) => !existingUsernames.has(u.username));
        if (missing.length > 0) {
          return [...missing, ...parsed];
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing stored users:', e);
      }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('tk_mishbah_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
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

  // General editing authority across master data & school profile:
  // ONLY Pemilik Akun AND Kepala Sekolah
  const canEditSchoolData = isAccountOwner || isPrincipal;

  // Granular check: can edit if authority holder OR self-owner of personal profile
  const canEditRecord = (
    entityType: 'student' | 'teacher' | 'staff' | 'school' | 'halaqoh' | 'user',
    targetId?: string
  ): boolean => {
    if (canEditSchoolData) return true;
    if (entityType === 'teacher' && targetId) {
      return currentUser.relatedTeacherId === targetId || currentUser.id === targetId;
    }
    if (entityType === 'staff' && targetId) {
      return currentUser.relatedStaffId === targetId || currentUser.id === targetId;
    }
    if (entityType === 'user' && targetId) {
      return currentUser.id === targetId;
    }
    return false;
  };

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_teachers');
    return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
  });

  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [studentAttendance, setStudentAttendance] = useState<StudentAttendanceRecord[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_std_att');
    return saved ? JSON.parse(saved) : INITIAL_STUDENT_ATTENDANCE;
  });

  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendanceRecord[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_tch_att');
    return saved ? JSON.parse(saved) : INITIAL_TEACHER_ATTENDANCE;
  });

  const [halaqohAssessments, setHalaqohAssessments] = useState<HalaqohAssessment[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_halaqoh');
    return saved ? JSON.parse(saved) : INITIAL_HALAQOH_ASSESSMENTS;
  });

  const [halaqohGroups, setHalaqohGroups] = useState<HalaqohGroupInfo[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_halaqoh_groups');
    return saved ? JSON.parse(saved) : INITIAL_HALAQOH_GROUPS;
  });

  const [sppInvoices, setSppInvoices] = useState<SppInvoice[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_spp');
    return saved ? JSON.parse(saved) : INITIAL_SPP_INVOICES;
  });

  const [chatGroups] = useState<ChatGroup[]>(INITIAL_CHAT_GROUPS);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_chats');
    return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_gallery');
    return saved ? JSON.parse(saved) : INITIAL_GALLERY;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('tk_mishbah_leaves');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [showDemoSwitcher, setShowDemoSwitcher] = useState<boolean>(() => {
    const saved = localStorage.getItem('tk_mishbah_demo_switcher');
    return saved !== null ? JSON.parse(saved) : true;
  });

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

  // LocalStorage sync effects
  useEffect(() => {
    localStorage.setItem('tk_mishbah_school_profile', JSON.stringify(schoolProfile));
  }, [schoolProfile]);
  useEffect(() => {
    localStorage.setItem('tk_mishbah_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_std_att', JSON.stringify(studentAttendance));
  }, [studentAttendance]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_tch_att', JSON.stringify(teacherAttendance));
  }, [teacherAttendance]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_halaqoh', JSON.stringify(halaqohAssessments));
  }, [halaqohAssessments]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_halaqoh_groups', JSON.stringify(halaqohGroups));
  }, [halaqohGroups]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_spp', JSON.stringify(sppInvoices));
  }, [sppInvoices]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_chats', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_gallery', JSON.stringify(gallery));
  }, [gallery]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_leaves', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('tk_mishbah_demo_switcher', JSON.stringify(showDemoSwitcher));
  }, [showDemoSwitcher]);

  const toggleDemoSwitcher = () => setShowDemoSwitcher((prev) => !prev);

  // Auth functions
  const login = (username: string, _password?: string): boolean => {
    const found = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (found) {
      setCurrentUser(found);
      addNotification({
        title: 'Berhasil Masuk',
        message: `Selamat datang kembali, ${found.name} (${found.role.toUpperCase()})`,
        type: 'info',
        forRole: found.role
      });
      return true;
    }
    return false;
  };

  const quickSwitchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const logout = () => {
    // switch to parent or default
    setCurrentUser(INITIAL_USERS[0]);
  };

  const updateUserAvatar = (userId: string, newAvatarUrl: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, avatarUrl: newAvatarUrl } : u))
    );
    setCurrentUser((prev) => (prev.id === userId ? { ...prev, avatarUrl: newAvatarUrl } : prev));
  };

  const updateOwnerUser = (updatedData: Partial<User>) => {
    if (!canEditSchoolData && !isAccountOwner) {
      alert('Akses Ditolak: Penggantian data pemilik akun hanya dapat dilakukan oleh Pemilik Akun atau Kepala Sekolah.');
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
  };

  // Student CRUD
  const addStudent = (newStd: Omit<Student, 'id' | 'barcode'>) => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Penambahan santri baru hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah.');
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
  };

  const updateStudent = (updatedStd: Student) => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Pengeditan data santri hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah.');
      return;
    }
    setStudents((prev) => prev.map((s) => (s.id === updatedStd.id ? updatedStd : s)));
  };

  const deleteStudent = (studentId: string) => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Penghapusan data santri hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah.');
      return;
    }
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const updateStudentHalaqoh = (studentId: string, halaqohGroup: string) => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Pengaturan kelompok halaqoh santri hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah.');
      return;
    }
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, halaqohGroup } : s))
    );
  };

  const batchAssignHalaqoh = (studentIds: string[], halaqohGroup: string) => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Pemindahan kelompok halaqoh massal hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah.');
      return;
    }
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
  };

  const addHalaqohGroup = (newGroup: Omit<HalaqohGroupInfo, 'id'>) => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Penambahan kelompok halaqoh hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah.');
      return;
    }
    const id = `hlq-grp-${Date.now()}`;
    setHalaqohGroups((prev) => [...prev, { ...newGroup, id }]);
    addNotification({
      title: 'Kelompok Halaqoh Baru',
      message: `Kelompok ${newGroup.name} dengan pembimbing ${newGroup.mentorName} berhasil dibuat.`,
      type: 'success',
      forRole: 'all',
      linkTab: 'master-data'
    });
  };

  const updateHalaqohGroup = (updatedGroup: HalaqohGroupInfo) => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Pengeditan kelompok halaqoh hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah.');
      return;
    }
    setHalaqohGroups((prev) =>
      prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
    );
  };

  const importStudentsBatch = (
    newRows: Omit<Student, 'id' | 'barcode'>[],
    mode: 'append' | 'replace' | 'upsert' = 'append'
  ): number => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Import data santri Excel hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah.');
      return 0;
    }
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
    }

    addNotification({
      title: 'Import & Sinkronisasi Presensi Berhasil',
      message: `${newRows.length} data santri berhasil diimpor otomatis dari Excel (${mode}), langsung terhubung ke presensi hari ini dan siap scan barcode.`,
      type: 'success',
      forRole: 'all',
      linkTab: 'student-att'
    });

    return affectedCount;
  };

  // Teacher CRUD
  const addTeacher = (newTch: Omit<Teacher, 'id'>) => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Penambahan data guru baru hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah.');
      return;
    }
    const id = `tch-${Date.now()}`;
    const fullTeacher: Teacher = { ...newTch, id };
    setTeachers((prev) => [...prev, fullTeacher]);
  };

  const updateTeacher = (updatedTch: Teacher) => {
    const isSelf = currentUser.relatedTeacherId === updatedTch.id || currentUser.id === updatedTch.id;
    if (!canEditSchoolData && !isSelf) {
      alert('Akses Ditolak: Pengeditan data guru hanya dapat dilakukan oleh Pemilik Akun, Kepala Sekolah, atau guru pemilik akun.');
      return;
    }
    setTeachers((prev) => prev.map((t) => (t.id === updatedTch.id ? updatedTch : t)));
  };

  const deleteTeacher = (teacherId: string) => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Penghapusan guru hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah.');
      return;
    }
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
  };

  const importTeachersBatch = (
    newRows: Omit<Teacher, 'id'>[],
    mode: 'append' | 'replace' | 'upsert' = 'append'
  ): number => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Import data guru Excel hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah.');
      return 0;
    }
    let affectedCount = 0;
    setTeachers((prev) => {
      if (mode === 'replace') {
        const mapped = newRows.map((item, index) => {
          const id = `tch-${Date.now()}-${index}`;
          return { ...item, id } as Teacher;
        });
        affectedCount = mapped.length;
        return mapped;
      }

      if (mode === 'upsert') {
        const updatedList = [...prev];
        newRows.forEach((item, index) => {
          const existingIdx = updatedList.findIndex(
            (t) =>
              (item.nuptk && t.nuptk === item.nuptk) ||
              t.name.trim().toLowerCase() === item.name.trim().toLowerCase()
          );
          if (existingIdx !== -1) {
            updatedList[existingIdx] = {
              ...updatedList[existingIdx],
              ...item
            };
            affectedCount++;
          } else {
            const id = `tch-${Date.now()}-${index}`;
            updatedList.push({ ...item, id });
            affectedCount++;
          }
        });
        return updatedList;
      }

      // Default 'append'
      const generated = newRows.map((item, index) => {
        const id = `tch-${Date.now()}-${index}`;
        return { ...item, id } as Teacher;
      });
      affectedCount = generated.length;
      return [...prev, ...generated];
    });

    addNotification({
      title: 'Import Data Guru Berhasil',
      message: `${newRows.length} data guru/ustadzah berhasil diimpor otomatis dari file Excel (${mode}).`,
      type: 'success',
      forRole: 'all',
      linkTab: 'master-data'
    });

    return affectedCount;
  };

  // Staff CRUD
  const addStaff = (newStaff: Omit<Staff, 'id'>) => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Penambahan pegawai baru hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah.');
      return;
    }
    const id = `stf-${Date.now()}`;
    setStaff((prev) => [...prev, { ...newStaff, id }]);
  };

  const updateStaff = (updatedStaff: Staff) => {
    const isSelf = currentUser.relatedStaffId === updatedStaff.id || currentUser.id === updatedStaff.id;
    if (!canEditSchoolData && !isSelf) {
      alert('Akses Ditolak: Pengeditan data pegawai hanya dapat dilakukan oleh Pemilik Akun, Kepala Sekolah, atau pegawai pemilik akun.');
      return;
    }
    setStaff((prev) => prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s)));
  };

  const deleteStaff = (staffId: string) => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Penghapusan data pegawai hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah.');
      return;
    }
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
  };

  // Teacher Attendance
  const recordTeacherAttendance = (
    teacherId: string,
    selfieUrl: string,
    locationData: TeacherAttendanceRecord['location'],
    notes?: string
  ) => {
    const teacher = teachers.find((t) => t.id === teacherId) || { name: currentUser.name };
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
      teacherName: teacher.name,
      selfieUrl,
      status,
      notes: notes || (isLate ? 'Hadir lewat batas 07:30 WIB' : 'Presensi pagi tepat waktu'),
      location: locationData
    };

    setTeacherAttendance((prev) => [newRecord, ...prev]);

    addNotification({
      title: 'Presensi Guru Tercatat',
      message: `${teacher.name} berhasil melakukan selfie presensi (${status}) pada ${time} WIB.`,
      type: isLate ? 'warning' : 'success',
      forRole: 'all',
      linkTab: 'teacher-att'
    });
  };

  // Student Attendance (Barcode Scan or Manual)
  const recordStudentAttendance = (
    recordData: Omit<StudentAttendanceRecord, 'id' | 'date' | 'time'>
  ) => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    // Check if already checked in today
    const existingIndex = studentAttendance.findIndex(
      (r) => r.studentId === recordData.studentId && r.date === date
    );

    const isLate = recordData.status === 'Terlambat' || (!recordData.status && (now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() > 30)));
    const finalStatus = recordData.status || (isLate ? 'Terlambat' : 'Hadir');

    const newRec: StudentAttendanceRecord = {
      ...recordData,
      id: `att-s-${Date.now()}`,
      date,
      time,
      status: finalStatus
    };

    if (existingIndex >= 0) {
      // update today's record
      setStudentAttendance((prev) => {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], ...newRec };
        return copy;
      });
    } else {
      setStudentAttendance((prev) => [newRec, ...prev]);
    }

    // Trigger Notification to parents & teachers
    if (finalStatus === 'Terlambat') {
      addNotification({
        title: '⚠️ Notifikasi Siswa Terlambat',
        message: `Santri ${recordData.studentName} (${recordData.className}) tiba di sekolah pukul ${time} WIB (Terlambat).`,
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
        linkTab: 'student-att'
      });
    }

    return {
      success: true,
      message: `Presensi ${recordData.studentName} berhasil dicatat (${finalStatus})`,
      record: newRec
    };
  };

  const batchUpdateStudentAttendance = (records: StudentAttendanceRecord[]) => {
    setStudentAttendance((prev) => {
      const remaining = prev.filter((p) => !records.some((r) => r.id === p.id));
      return [...records, ...remaining];
    });
  };

  // Halaqoh
  const addHalaqohAssessment = (assessmentData: Omit<HalaqohAssessment, 'id' | 'date'>) => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const newAssessment: HalaqohAssessment = {
      ...assessmentData,
      id: `hlq-${Date.now()}`,
      date
    };

    setHalaqohAssessments((prev) => [newAssessment, ...prev]);

    // Push notification to parents
    addNotification({
      title: '📖 Laporan Halaqoh Tahfidz Baru',
      message: `Ananda ${assessmentData.studentName} telah menyetorkan ${assessmentData.surahOrJilid} dengan predikat ${assessmentData.grade}!`,
      type: 'success',
      forRole: 'ortu',
      linkTab: 'halaqoh'
    });
  };

  const updateHalaqohAssessment = (updated: HalaqohAssessment) => {
    setHalaqohAssessments((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
  };

  // SPP Payment
  const paySppInvoice = (
    invoiceId: string,
    method: SppInvoice['paymentMethod'],
    ref?: string
  ) => {
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
  };

  const verifySppInvoice = (invoiceId: string) => {
    setSppInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'LUNAS' } : inv))
    );
  };

  // Chat
  const sendChatMessage = (
    text: string,
    groupId?: string,
    recipientId?: string,
    attachmentUrl?: string
  ) => {
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
  };

  // Announcements
  const addAnnouncement = (newAnn: Omit<Announcement, 'id' | 'date'>) => {
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
  };

  // Gallery
  const addGalleryItem = (item: Omit<GalleryItem, 'id' | 'date'>) => {
    const date = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    setGallery((prev) => [{ ...item, id: `gal-${Date.now()}`, date }, ...prev]);
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
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // School Profile Update
  const updateSchoolProfile = (updated: Partial<SchoolProfile>) => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Profil dan identitas sekolah hanya dapat diubah oleh Pemilik Akun dan Kepala Sekolah.');
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
  };

  // Leave & Permits Management (Perizinan Guru & Karyawan - ACC Kepala Sekolah)
  const submitLeaveRequest = (
    data: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy' | 'reviewNotes'>
  ) => {
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
      message: `${data.applicantName} (${data.applicantPosition}) mengajukan perizinan ${data.leaveType} (${data.totalDays} hari). Menunggu ACC Kepala Sekolah.`,
      type: 'warning',
      forRole: 'all',
      linkTab: 'teacher-att'
    });
  };

  const approveLeaveRequest = (leaveId: string, reviewNotes?: string) => {
    if (!isPrincipal && !isAccountOwner) {
      alert('Akses Ditolak: Hanya Kepala Sekolah (atau Pemilik Akun) yang berwenang memberikan ACC / Persetujuan Izin & Cuti Guru & Karyawan.');
      return;
    }

    const target = leaveRequests.find((l) => l.id === leaveId);
    if (!target) return;

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeFormatted = now.toTimeString().split(' ')[0].substring(0, 5);
    const reviewerName = isPrincipal ? 'Hj. Siti Khadijah, M.Pd.I (Kepala Sekolah)' : `${currentUser.name} (Pemilik Akun)`;

    setLeaveRequests((prev) =>
      prev.map((item) =>
        item.id === leaveId
          ? {
              ...item,
              status: 'approved',
              reviewedAt: `${dateFormatted} - ${timeFormatted} WIB`,
              reviewedBy: reviewerName,
              reviewNotes: reviewNotes || 'Disetujui resmi oleh Kepala Sekolah.'
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
  };

  const rejectLeaveRequest = (leaveId: string, reviewNotes?: string) => {
    if (!isPrincipal && !isAccountOwner) {
      alert('Akses Ditolak: Hanya Kepala Sekolah (atau Pemilik Akun) yang berwenang menolak atau meninjau perizinan.');
      return;
    }
    const target = leaveRequests.find((l) => l.id === leaveId);
    if (!target) return;

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeFormatted = now.toTimeString().split(' ')[0].substring(0, 5);
    const reviewerName = isPrincipal ? 'Hj. Siti Khadijah, M.Pd.I (Kepala Sekolah)' : `${currentUser.name} (Pemilik Akun)`;

    setLeaveRequests((prev) =>
      prev.map((item) =>
        item.id === leaveId
          ? {
              ...item,
              status: 'rejected',
              reviewedAt: `${dateFormatted} - ${timeFormatted} WIB`,
              reviewedBy: reviewerName,
              reviewNotes: reviewNotes || 'Tidak disetujui / ditolak oleh Kepala Sekolah.'
            }
          : item
      )
    );

    addNotification({
      title: `❌ Pengajuan Izin/Cuti Ditolak`,
      message: `Permohonan ${target.leaveType} dari ${target.applicantName} tidak disetujui oleh Kepala Sekolah. Catatan: ${reviewNotes || 'Alasan dinas/operasional.'}`,
      type: 'warning',
      forRole: 'all',
      linkTab: 'teacher-att'
    });
  };

  const deleteLeaveRequest = (leaveId: string) => {
    if (!canEditSchoolData) {
      alert('Akses Ditolak: Penghapusan berkas perizinan hanya dapat dilakukan oleh Kepala Sekolah atau Pemilik Akun.');
      return;
    }
    setLeaveRequests((prev) => prev.filter((l) => l.id !== leaveId));
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
        canEditRecord,

        login,
        quickSwitchUser,
        logout,
        updateUserAvatar,

        addStudent,
        updateStudent,
        deleteStudent,
        importStudentsBatch,

        addTeacher,
        updateTeacher,
        deleteTeacher,
        importTeachersBatch,

        addStaff,
        updateStaff,
        deleteStaff,

        recordTeacherAttendance,
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
        toggleDemoSwitcher
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
