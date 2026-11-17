import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, Teacher, Staff, HalaqohGroupInfo, StaffPosition, STAFF_POSITIONS } from '../../types';
import {
  Users,
  GraduationCap,
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  QrCode,
  Printer,
  FileSpreadsheet,
  Download,
  Upload,
  Camera,
  BookOpen,
  Layers,
  ArrowRightLeft,
  CheckSquare,
  Award,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { StudentCardModal } from '../cards/StudentCardModal';
import { StudentQrCardGeneratorModal } from './StudentQrCardGeneratorModal';
import { ExcelImportModal } from './ExcelImportModal';
import { PhotoUploadModal } from '../common/PhotoUploadModal';
import {
  exportStudentsToExcel,
  exportTeachersToExcel,
  downloadStudentExcelTemplate,
  downloadTeacherExcelTemplate
} from '../../utils/excelHelper';

export const MasterDataManagement: React.FC = () => {
  const {
    students,
    teachers,
    staff,
    addStudent,
    updateStudent,
    deleteStudent,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addStaff,
    updateStaff,
    deleteStaff,
    addNotification,
    halaqohGroups,
    updateStudentHalaqoh,
    batchAssignHalaqoh,
    addHalaqohGroup,
    updateHalaqohGroup,
    currentUser,
    users,
    quickSwitchUser,
    isAccountOwner,
    isPrincipal,
    canEditSchoolData,
    canEditRecord,
    showDemoSwitcher
  } = useApp();

  const [activeTab, setActiveTab] = useState<'students' | 'halaqoh' | 'teachers' | 'staff'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedHalaqohFilter, setSelectedHalaqohFilter] = useState<string>('all');

  // Halaqoh management states
  const [activeHalaqohCardId, setActiveHalaqohCardId] = useState<string>('all');
  const [selectedStudentIdsForHalaqoh, setSelectedStudentIdsForHalaqoh] = useState<string[]>([]);
  const [targetHalaqohForBatch, setTargetHalaqohForBatch] = useState<string>('');
  const [quickHalaqohStudent, setQuickHalaqohStudent] = useState<Student | null>(null);

  const [isHalaqohModalOpen, setIsHalaqohModalOpen] = useState(false);
  const [editingHalaqoh, setEditingHalaqoh] = useState<HalaqohGroupInfo | null>(null);
  const [halaqohForm, setHalaqohForm] = useState<Omit<HalaqohGroupInfo, 'id'>>({
    name: '',
    shortName: '',
    mentorName: '',
    mentorPhone: '',
    focus: '',
    targetLevel: '',
    room: '',
    scheduleTime: '08.00 - 09.15 WIB',
    color: 'emerald'
  });

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Student Card Modal
  const [cardPreviewStudent, setCardPreviewStudent] = useState<Student | null>(null);

  // Student QR Card Batch Generator Modal
  const [isQrGeneratorOpen, setIsQrGeneratorOpen] = useState(false);
  const [qrGeneratorInitialId, setQrGeneratorInitialId] = useState<string | undefined>(undefined);

  // Excel Import Modal State
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [excelTargetType, setExcelTargetType] = useState<'student' | 'teacher'>('student');

  // Photo Upload & Avatar Editor Modal State
  const [photoModalTarget, setPhotoModalTarget] = useState<{
    id?: string;
    name: string;
    currentPhoto: string;
    type: 'student' | 'teacher' | 'staff';
    gender?: 'L' | 'P';
    isFormMode?: boolean;
  } | null>(null);

  const handleSavePhotoModal = (newPhotoUrl: string) => {
    if (!photoModalTarget) return;

    if (photoModalTarget.isFormMode) {
      if (photoModalTarget.type === 'student') {
        setStudentForm((prev) => ({ ...prev, photoUrl: newPhotoUrl }));
      } else if (photoModalTarget.type === 'teacher') {
        setTeacherForm((prev) => ({ ...prev, photoUrl: newPhotoUrl }));
      } else if (photoModalTarget.type === 'staff') {
        setStaffForm((prev) => ({ ...prev, photoUrl: newPhotoUrl }));
      }
    } else if (photoModalTarget.id) {
      if (photoModalTarget.type === 'student') {
        const existing = students.find((s) => s.id === photoModalTarget.id);
        if (existing) {
          updateStudent({ ...existing, photoUrl: newPhotoUrl });
          addNotification({
            title: 'Foto Santri Diperbarui',
            message: `Foto profil santri ${existing.name} berhasil diperbarui.`,
            type: 'success',
            forRole: 'all',
            linkTab: 'master-data'
          });
        }
      } else if (photoModalTarget.type === 'teacher') {
        const existing = teachers.find((t) => t.id === photoModalTarget.id);
        if (existing) {
          updateTeacher({ ...existing, photoUrl: newPhotoUrl });
          addNotification({
            title: 'Foto Guru Diperbarui',
            message: `Foto profil pendidik ${existing.name} berhasil diperbarui.`,
            type: 'success',
            forRole: 'all',
            linkTab: 'master-data'
          });
        }
      } else if (photoModalTarget.type === 'staff') {
        const existing = staff.find((st) => st.id === photoModalTarget.id);
        if (existing) {
          updateStaff({ ...existing, photoUrl: newPhotoUrl });
          addNotification({
            title: 'Foto Pegawai Diperbarui',
            message: `Foto profil pegawai ${existing.name} berhasil diperbarui.`,
            type: 'success',
            forRole: 'all',
            linkTab: 'master-data'
          });
        }
      }
    }
    setPhotoModalTarget(null);
  };

  const handleDirectFileUpload = (
    file: File,
    target: 'student' | 'teacher' | 'staff'
  ) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (target === 'student') {
          setStudentForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
        } else if (target === 'teacher') {
          setTeacherForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
        } else if (target === 'staff') {
          setStaffForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Student Form State
  const [studentForm, setStudentForm] = useState({
    name: '',
    nickName: '',
    nisn: '',
    gender: 'L' as 'L' | 'P',
    className: 'TK A-1',
    parentName: '',
    parentPhone: '',
    address: '',
    photoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80',
    birthDate: '2020-01-01',
    halaqohGroup: 'Halaqoh 1 (Fatimah)'
  });

  const [selectedTeacherDutyFilter, setSelectedTeacherDutyFilter] = useState<string>('all');
  const [selectedStaffDutyFilter, setSelectedStaffDutyFilter] = useState<string>('all');

  // Teacher Form State
  const [teacherForm, setTeacherForm] = useState<{
    nuptk: string;
    name: string;
    gender: 'L' | 'P';
    position: string;
    assignedDuty: StaffPosition;
    phone: string;
    email: string;
    photoUrl: string;
    status: 'Aktif' | 'Cuti' | 'Izin';
    teachingSubjects: string[];
  }>({
    nuptk: '',
    name: '',
    gender: 'P',
    position: 'Wali Kelas TK A-1',
    assignedDuty: 'Wali Kelas',
    phone: '',
    email: '',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    status: 'Aktif',
    teachingSubjects: ['Halaqoh Tahfidz', 'Sentra Bahan Alam']
  });

  // Staff Form State
  const [staffForm, setStaffForm] = useState<{
    nip: string;
    name: string;
    department: string;
    position: string;
    assignedDuty: StaffPosition;
    phone: string;
    photoUrl: string;
    status: 'Aktif' | 'Cuti';
  }>({
    nip: '',
    name: '',
    department: 'Tata Usaha & Administrasi',
    position: 'Staff Tata Usaha',
    assignedDuty: 'Staff',
    phone: '',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    status: 'Aktif'
  });

  // Open Add/Edit Student
  const handleOpenStudentModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setStudentForm({
        name: student.name,
        nickName: student.nickName,
        nisn: student.nisn,
        gender: student.gender,
        className: student.className,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        address: student.address,
        photoUrl: student.photoUrl,
        birthDate: student.birthDate,
        halaqohGroup: student.halaqohGroup
      });
    } else {
      setEditingStudent(null);
      setStudentForm({
        name: '',
        nickName: '',
        nisn: `01892${Math.floor(10000 + Math.random() * 90000)}`,
        gender: 'L',
        className: 'TK A-1',
        parentName: '',
        parentPhone: '0812-',
        address: 'Jakarta',
        photoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80',
        birthDate: '2020-04-10',
        halaqohGroup: 'Halaqoh 1 (Fatimah)'
      });
    }
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      updateStudent({
        ...editingStudent,
        ...studentForm
      });
    } else {
      addStudent(studentForm);
    }
    setIsStudentModalOpen(false);
  };

  // Open Add/Edit Teacher
  const handleOpenTeacherModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setTeacherForm({
        nuptk: teacher.nuptk,
        name: teacher.name,
        gender: teacher.gender,
        position: teacher.position,
        assignedDuty: teacher.assignedDuty || (teacher.position.includes('Wali') ? 'Wali Kelas' : teacher.position.includes('Kepala') ? 'Kepala Sekolah' : teacher.position.includes('Halaqoh') ? 'Pembimbing Halaqoh' : 'Guru'),
        phone: teacher.phone,
        email: teacher.email,
        photoUrl: teacher.photoUrl,
        status: teacher.status,
        teachingSubjects: teacher.teachingSubjects
      });
    } else {
      setEditingTeacher(null);
      setTeacherForm({
        nuptk: `199${Math.floor(1000 + Math.random() * 9000)}-202001-2-001`,
        name: '',
        gender: 'P',
        position: 'Guru Pengampu Sentra',
        assignedDuty: 'Guru',
        phone: '0812-',
        email: 'guru@tk-almishbah.sch.id',
        photoUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80',
        status: 'Aktif',
        teachingSubjects: ['Sentra Persiapan', 'Tahfidz Al-Quran']
      });
    }
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      updateTeacher({
        ...editingTeacher,
        ...teacherForm
      });
    } else {
      addTeacher(teacherForm);
    }
    setIsTeacherModalOpen(false);
  };

  // Open Add/Edit Staff
  const handleOpenStaffModal = (staffMember?: Staff) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setStaffForm({
        nip: staffMember.nip,
        name: staffMember.name,
        department: staffMember.department,
        position: staffMember.position || 'Staff Tata Usaha',
        assignedDuty: staffMember.assignedDuty || (staffMember.department.includes('Keuangan') || staffMember.department.includes('Keamanan') ? 'Karyawan' : 'Staff'),
        phone: staffMember.phone,
        photoUrl: staffMember.photoUrl,
        status: staffMember.status
      });
    } else {
      setEditingStaff(null);
      setStaffForm({
        nip: `PEG-2024-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        department: 'Tata Usaha & Administrasi',
        position: 'Staff Tata Usaha',
        assignedDuty: 'Staff',
        phone: '0812-',
        photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
        status: 'Aktif'
      });
    }
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      updateStaff({
        ...editingStaff,
        ...staffForm
      });
    } else {
      addStaff(staffForm);
    }
    setIsStaffModalOpen(false);
  };

  // Search and multidimensional filtering
  const q = searchQuery.toLowerCase();
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(q) ||
      s.nisn.includes(q) ||
      s.className.toLowerCase().includes(q) ||
      s.parentName.toLowerCase().includes(q) ||
      s.halaqohGroup.toLowerCase().includes(q);
    const matchClass = selectedClassFilter === 'all' || s.className === selectedClassFilter;
    const matchHalaqoh = selectedHalaqohFilter === 'all' || s.halaqohGroup === selectedHalaqohFilter;
    return matchSearch && matchClass && matchHalaqoh;
  });

  const filteredTeachers = teachers.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(q) ||
      t.nuptk.includes(q) ||
      t.position.toLowerCase().includes(q) ||
      (t.assignedDuty && t.assignedDuty.toLowerCase().includes(q));
    const matchDuty =
      selectedTeacherDutyFilter === 'all' ||
      t.assignedDuty === selectedTeacherDutyFilter ||
      (!t.assignedDuty && t.position.toLowerCase().includes(selectedTeacherDutyFilter.toLowerCase()));
    return matchSearch && matchDuty;
  });

  const filteredStaff = staff.filter((st) => {
    const matchSearch =
      st.name.toLowerCase().includes(q) ||
      st.nip.toLowerCase().includes(q) ||
      st.department.toLowerCase().includes(q) ||
      (st.position && st.position.toLowerCase().includes(q)) ||
      (st.assignedDuty && st.assignedDuty.toLowerCase().includes(q));
    const matchDuty =
      selectedStaffDutyFilter === 'all' ||
      st.assignedDuty === selectedStaffDutyFilter ||
      (!st.assignedDuty && ((st.position && st.position.toLowerCase().includes(selectedStaffDutyFilter.toLowerCase())) || st.department.toLowerCase().includes(selectedStaffDutyFilter.toLowerCase())));
    return matchSearch && matchDuty;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-700/80 rounded-lg text-emerald-200">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
              Pangkalan Data Induk Sekolah (CRUD)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            Manajemen Data Guru, Pegawai, Murid & Halaqoh
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
            Kelola, tambah, perbarui, atur kelompok halaqoh kelas, dan upload file Excel data santri yang otomatis terhubung ke sistem presensi.
          </p>
        </div>

        {/* Action Button */}
        {activeTab === 'students' && (
          <div className="flex flex-wrap items-center gap-2">
            {canEditSchoolData ? (
              <button
                onClick={() => {
                  setExcelTargetType('student');
                  setIsExcelImportOpen(true);
                }}
                className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md border border-emerald-500 transition-all flex items-center gap-2 cursor-pointer"
                title="Upload file Excel (.xlsx / .csv) untuk mengisi data santri otomatis"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                <span>Upload Excel Siswa</span>
              </button>
            ) : (
              <button
                disabled
                className="px-3.5 py-2.5 bg-emerald-900/50 text-emerald-300/60 font-bold text-xs rounded-xl border border-emerald-700/50 flex items-center gap-2 cursor-not-allowed"
                title="Pengeditan dan import Excel santri hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300/70" />
                <span>Upload Excel (Terkunci)</span>
              </button>
            )}
            <button
              onClick={() => exportStudentsToExcel(students)}
              className="px-3 py-2.5 bg-emerald-900/80 hover:bg-emerald-900 text-emerald-100 font-bold text-xs rounded-xl border border-emerald-600/60 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Unduh seluruh data murid ke Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ekspor</span>
            </button>
            <button
              onClick={() => {
                setQrGeneratorInitialId(undefined);
                setIsQrGeneratorOpen(true);
              }}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md border border-emerald-400 transition-all flex items-center gap-2 cursor-pointer"
              title="Generate dan cetak kartu tanda pengenal ber-QR Code untuk santri"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span>Cetak Kartu QR</span>
            </button>
            {canEditSchoolData ? (
              <button
                onClick={() => handleOpenStudentModal()}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Santri
              </button>
            ) : (
              <button
                disabled
                className="px-3.5 py-2.5 bg-slate-700/40 text-slate-300/60 font-bold text-xs rounded-xl border border-slate-600/40 flex items-center gap-1.5 cursor-not-allowed"
                title="Tambah santri hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah"
              >
                <Lock className="w-3.5 h-3.5" /> Tambah Santri (Terkunci)
              </button>
            )}
          </div>
        )}

        {activeTab === 'halaqoh' && (
          <div className="flex flex-wrap items-center gap-2">
            {canEditSchoolData ? (
              <button
                onClick={() => {
                  setExcelTargetType('student');
                  setIsExcelImportOpen(true);
                }}
                className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md border border-emerald-500 transition-all flex items-center gap-2 cursor-pointer"
                title="Upload file Excel santri & otomatis kelompokkan ke halaqoh"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                <span>Upload Excel Santri</span>
              </button>
            ) : (
              <button
                disabled
                className="px-3.5 py-2.5 bg-emerald-900/50 text-emerald-300/60 font-bold text-xs rounded-xl border border-emerald-700/50 flex items-center gap-2 cursor-not-allowed"
                title="Import Excel hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300/70" />
                <span>Upload Excel (Terkunci)</span>
              </button>
            )}
            <button
              onClick={() => exportStudentsToExcel(students)}
              className="px-3 py-2.5 bg-emerald-900/80 hover:bg-emerald-900 text-emerald-100 font-bold text-xs rounded-xl border border-emerald-600/60 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Unduh data pembagian santri per halaqoh ke Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ekspor Excel</span>
            </button>
            {canEditSchoolData ? (
              <button
                onClick={() => {
                  setEditingHalaqoh(null);
                  setHalaqohForm({
                    name: '',
                    shortName: '',
                    mentorName: '',
                    mentorPhone: '',
                    focus: '',
                    targetLevel: '',
                    room: '',
                    scheduleTime: '08.00 - 09.15 WIB',
                    color: 'emerald'
                  });
                  setIsHalaqohModalOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Halaqoh Baru
              </button>
            ) : (
              <button
                disabled
                className="px-3.5 py-2.5 bg-slate-700/40 text-slate-300/60 font-bold text-xs rounded-xl border border-slate-600/40 flex items-center gap-1.5 cursor-not-allowed"
                title="Hanya Pemilik Akun dan Kepala Sekolah yang dapat membuat halaqoh baru"
              >
                <Lock className="w-3.5 h-3.5" /> Tambah Halaqoh (Terkunci)
              </button>
            )}
          </div>
        )}
        {activeTab === 'teachers' && (
          <div className="flex flex-wrap items-center gap-2">
            {canEditSchoolData ? (
              <button
                onClick={() => {
                  setExcelTargetType('teacher');
                  setIsExcelImportOpen(true);
                }}
                className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md border border-emerald-500 transition-all flex items-center gap-2 cursor-pointer"
                title="Upload file Excel (.xlsx / .csv) untuk mengisi data guru otomatis"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                <span>Upload Excel Guru</span>
              </button>
            ) : (
              <button
                disabled
                className="px-3.5 py-2.5 bg-emerald-900/50 text-emerald-300/60 font-bold text-xs rounded-xl border border-emerald-700/50 flex items-center gap-2 cursor-not-allowed"
                title="Hanya Pemilik Akun dan Kepala Sekolah yang dapat mengimpor Excel guru"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300/70" />
                <span>Upload Excel (Terkunci)</span>
              </button>
            )}
            <button
              onClick={() => exportTeachersToExcel(teachers)}
              className="px-3 py-2.5 bg-emerald-900/80 hover:bg-emerald-900 text-emerald-100 font-bold text-xs rounded-xl border border-emerald-600/60 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Unduh seluruh data guru ke Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ekspor</span>
            </button>
            {canEditSchoolData ? (
              <button
                onClick={() => handleOpenTeacherModal()}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Guru Baru
              </button>
            ) : (
              <button
                disabled
                className="px-3.5 py-2.5 bg-slate-700/40 text-slate-300/60 font-bold text-xs rounded-xl border border-slate-600/40 flex items-center gap-1.5 cursor-not-allowed"
                title="Tambah guru hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah"
              >
                <Lock className="w-3.5 h-3.5" /> Tambah Guru (Terkunci)
              </button>
            )}
          </div>
        )}
        {activeTab === 'staff' && (
          canEditSchoolData ? (
            <button
              onClick={() => handleOpenStaffModal()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Pegawai Baru
            </button>
          ) : (
            <button
              disabled
              className="px-3.5 py-2.5 bg-slate-700/40 text-slate-300/60 font-bold text-xs rounded-xl border border-slate-600/40 flex items-center gap-1.5 cursor-not-allowed"
              title="Tambah pegawai hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah"
            >
              <Lock className="w-3.5 h-3.5" /> Tambah Pegawai (Terkunci)
            </button>
          )
        )}
      </div>

      {/* Permission Status Banner */}
      {canEditSchoolData ? (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-xs">
                Hak Akses Penuh: {isAccountOwner ? '👑 Pemilik Akun' : '🏫 Kepala Sekolah'} ({currentUser.name})
              </span>
              <p className="text-[11px] text-emerald-800">
                Anda memiliki wewenang penuh untuk menambah, mengedit, mengimpor Excel, dan menghapus data santri, guru, pegawai, serta kelompok halaqoh.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-200 text-emerald-900 font-extrabold text-[10px] rounded-lg tracking-wide uppercase shrink-0">
            Mode Pengeditan Aktif
          </span>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-950 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-200 text-amber-900 rounded-xl shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-xs sm:text-sm text-amber-950">
                  Mode Pratinjau (Hanya Lihat)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                  Akses Pengeditan Terkunci
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1 max-w-2xl leading-relaxed">
                Pengeditan data santri, rombel halaqoh, dan kepegawaian <strong>hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah</strong>. Sebagai <strong>{currentUser.name} ({currentUser.position || currentUser.role})</strong>, Anda dapat melihat data dan mengedit foto serta data profil Anda sendiri.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation tabs & Search */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              Data Santri ({students.length})
            </button>
            <button
              onClick={() => setActiveTab('halaqoh')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'halaqoh'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Kelompok Halaqoh ({halaqohGroups.length})
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'teachers'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              Data Guru ({teachers.length})
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4 text-emerald-600" />
              Data Pegawai ({staff.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {(activeTab === 'students' || activeTab === 'halaqoh') && (
              <>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-emerald-600 cursor-pointer"
                >
                  <option value="all">Semua Kelas</option>
                  <option value="TK A-1">Kelas TK A-1</option>
                  <option value="TK A-2">Kelas TK A-2</option>
                  <option value="TK B-1">Kelas TK B-1</option>
                  <option value="TK B-2">Kelas TK B-2</option>
                  <option value="Playgroup">Playgroup</option>
                </select>

                <select
                  value={selectedHalaqohFilter}
                  onChange={(e) => setSelectedHalaqohFilter(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-emerald-600 max-w-[170px] truncate cursor-pointer"
                >
                  <option value="all">Semua Halaqoh</option>
                  {halaqohGroups.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.shortName}
                    </option>
                  ))}
                </select>
              </>
            )}

            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari santri, NISN, halaqoh..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* TAB 1: DATA MURID (STUDENTS) */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            {/* Quick Excel helper bar */}
            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-emerald-950">Isi Data Siswa Otomatis via Excel:</span>
                  <p className="text-[11px] text-emerald-700">
                    Upload file Excel (.xlsx / .csv) berisi nama, kelas, NISN, dan kontak wali murid. Data langsung terisi otomatis.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
                <button
                  type="button"
                  onClick={() => downloadStudentExcelTemplate()}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-100/50 text-emerald-900 border border-emerald-300 rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1.5 justify-center flex-1 sm:flex-none cursor-pointer"
                  title="Unduh contoh template Excel resmi santri"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Template (.xlsx)</span>
                </button>
                {canEditSchoolData ? (
                  <button
                    type="button"
                    onClick={() => {
                      setExcelTargetType('student');
                      setIsExcelImportOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1.5 justify-center flex-1 sm:flex-none shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File Excel</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl font-bold text-[11px] flex items-center gap-1.5 justify-center flex-1 sm:flex-none cursor-not-allowed"
                    title="Import Excel hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah"
                  >
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Upload Excel (Terkunci)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Santri</th>
                  <th className="py-3 px-4">NIS / NISN</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Wali Murid</th>
                  <th className="py-3 px-4">Halaqoh</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative group shrink-0">
                          <img
                            src={std.photoUrl}
                            alt={std.name}
                            className="w-11 h-11 rounded-xl object-cover border border-emerald-200"
                          />
                          {canEditSchoolData && (
                            <button
                              type="button"
                              onClick={() =>
                                setPhotoModalTarget({
                                  id: std.id,
                                  name: std.name,
                                  currentPhoto: std.photoUrl,
                                  type: 'student',
                                  gender: std.gender
                                })
                              }
                              className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer"
                              title="Klik untuk ubah foto santri"
                            >
                              <Camera className="w-4 h-4 text-emerald-300" />
                              <span>Foto</span>
                            </button>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{std.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Panggilan: {std.nickName} • ({std.gender === 'L' ? 'Laki-laki' : 'Perempuan'})
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-emerald-800">{std.id}</div>
                      <div className="text-[10px] text-slate-400">NISN: {std.nisn}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {std.className}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-semibold">{std.parentName}</div>
                      <div className="text-[10px] text-slate-400">{std.parentPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      {canEditSchoolData ? (
                        <button
                          type="button"
                          onClick={() => setQuickHalaqohStudent(std)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[10px] border border-emerald-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer group"
                          title="Klik untuk atur / ubah kelompok halaqoh santri ini"
                        >
                          <BookOpen className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[150px]">{std.halaqohGroup}</span>
                          <ArrowRightLeft className="w-2.5 h-2.5 text-emerald-500 group-hover:text-emerald-800 transition-colors shrink-0" />
                        </button>
                      ) : (
                        <div
                          className="px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg font-bold text-[10px] border border-slate-200 flex items-center gap-1.5 shadow-2xs cursor-not-allowed"
                          title="Pengaturan halaqoh santri hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah"
                        >
                          <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{std.halaqohGroup}</span>
                          <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEditSchoolData && (
                          <button
                            onClick={() =>
                              setPhotoModalTarget({
                                id: std.id,
                                name: std.name,
                                currentPhoto: std.photoUrl,
                                type: 'student',
                                gender: std.gender
                              })
                            }
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Ubah / Upload Foto Santri"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setQrGeneratorInitialId(std.id);
                            setIsQrGeneratorOpen(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg transition-all flex items-center gap-1 font-bold text-[10px] shadow-2xs"
                          title="Generate & Cetak Kartu ID QR Siswa"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Kartu QR</span>
                        </button>
                        <button
                          onClick={() => setCardPreviewStudent(std)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Pratinjau Kartu Santri"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        {canEditSchoolData ? (
                          <>
                            <button
                              onClick={() => handleOpenStudentModal(std)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data Santri"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus data santri ${std.name}?`)) {
                                  deleteStudent(std.id);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Santri"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span
                            className="p-1.5 text-slate-300 rounded-lg cursor-not-allowed"
                            title="Pengeditan data santri hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah"
                          >
                            <Lock className="w-4 h-4 text-slate-300" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: KELOMPOK HALAQOH KELAS */}
      {activeTab === 'halaqoh' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-amber-300 flex items-center justify-center shrink-0 shadow-sm">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                    Manajemen Halaqoh Terintegrasi
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {halaqohGroups.length} Kelompok Aktif
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Pengaturan Kelompok Halaqoh Tahfidz & Pembimbing
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  Atur pembagian santri ke dalam kelompok mengaji (halaqoh) per kelas atau lintas rombel. Santri yang diimpor dari Excel langsung terhubung ke presensi dan grup halaqoh masing-masing.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setEditingHalaqoh(null);
                  setHalaqohForm({
                    name: '',
                    shortName: '',
                    mentorName: '',
                    mentorPhone: '',
                    focus: '',
                    targetLevel: '',
                    room: '',
                    scheduleTime: '08.00 - 09.15 WIB',
                    color: 'emerald'
                  });
                  setIsHalaqohModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer flex-1 sm:flex-none justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kelompok</span>
              </button>
            </div>
          </div>

          {/* Halaqoh Groups Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {halaqohGroups.map((grp) => {
              const countInGroup = students.filter((s) => s.halaqohGroup === grp.name).length;
              const isSelectedCard = selectedHalaqohFilter === grp.name;

              return (
                <div
                  key={grp.id}
                  onClick={() => {
                    if (selectedHalaqohFilter === grp.name) {
                      setSelectedHalaqohFilter('all');
                    } else {
                      setSelectedHalaqohFilter(grp.name);
                    }
                  }}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelectedCard
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/30'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                            {grp.shortName}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {grp.name.split('(')[0].trim()}
                          </h4>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                        {countInGroup} Santri
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                      <div>
                        Musyrif: <strong className="text-slate-900">{grp.mentorName}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">
                        📍 {grp.room} • {grp.scheduleTime}
                      </div>
                      <div className="text-[10px] text-emerald-800 font-medium line-clamp-2 bg-white/80 p-2 rounded-xl border border-emerald-100 mt-1">
                        🎯 {grp.focus}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold text-[10px]">
                      {isSelectedCard ? '✓ Filter Aktif' : 'Klik untuk filter'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingHalaqoh(grp);
                        setHalaqohForm({
                          name: grp.name,
                          shortName: grp.shortName,
                          mentorName: grp.mentorName,
                          mentorPhone: grp.mentorPhone || '',
                          focus: grp.focus,
                          targetLevel: grp.targetLevel,
                          room: grp.room,
                          scheduleTime: grp.scheduleTime,
                          color: grp.color
                        });
                        setIsHalaqohModalOpen(true);
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Info</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Santri Roster & Batch Organizer */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <h4 className="text-sm font-bold text-slate-900">
                  Daftar Santri & Penempatan Kelompok Halaqoh
                </h4>
                <span className="text-xs font-bold text-slate-500">
                  ({filteredStudents.length} santri ditampilkan)
                </span>
              </div>

              {/* Reset filter button if active */}
              {(selectedHalaqohFilter !== 'all' || selectedClassFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHalaqohFilter('all');
                    setSelectedClassFilter('all');
                  }}
                  className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
                >
                  ✕ Reset Filter
                </button>
              )}
            </div>

            {/* Batch Action Bar (Appears when students are selected) */}
            {selectedStudentIdsForHalaqoh.length > 0 && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                  <CheckSquare className="w-4 h-4 text-emerald-700" />
                  <span>{selectedStudentIdsForHalaqoh.length} santri terpilih untuk pemindahan massal</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={targetHalaqohForBatch}
                    onChange={(e) => setTargetHalaqohForBatch(e.target.value)}
                    className="text-xs font-bold bg-white border border-emerald-400 rounded-xl px-3 py-2 text-emerald-950 focus:outline-emerald-600 shadow-2xs"
                  >
                    <option value="">-- Pilih Halaqoh Tujuan --</option>
                    {halaqohGroups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name} ({g.mentorName})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={!targetHalaqohForBatch}
                    onClick={() => {
                      if (!targetHalaqohForBatch) return;
                      batchAssignHalaqoh(selectedStudentIdsForHalaqoh, targetHalaqohForBatch);
                      setSelectedStudentIdsForHalaqoh([]);
                      setTargetHalaqohForBatch('');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      targetHalaqohForBatch
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Terapkan
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStudentIdsForHalaqoh([])}
                    className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredStudents.length > 0 &&
                          selectedStudentIdsForHalaqoh.length === filteredStudents.length
                        }
                        onChange={() => {
                          if (selectedStudentIdsForHalaqoh.length === filteredStudents.length) {
                            setSelectedStudentIdsForHalaqoh([]);
                          } else {
                            setSelectedStudentIdsForHalaqoh(filteredStudents.map((s) => s.id));
                          }
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Kelompok Halaqoh Saat Ini</th>
                    <th className="py-3 px-4">Wali Murid</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Tidak ada santri yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((std) => {
                      const isChecked = selectedStudentIdsForHalaqoh.includes(std.id);
                      return (
                        <tr
                          key={std.id}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            isChecked ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedStudentIdsForHalaqoh(
                                    selectedStudentIdsForHalaqoh.filter((id) => id !== std.id)
                                  );
                                } else {
                                  setSelectedStudentIdsForHalaqoh([
                                    ...selectedStudentIdsForHalaqoh,
                                    std.id
                                  ]);
                                }
                              }}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative group shrink-0">
                                <img
                                  src={std.photoUrl}
                                  alt={std.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-emerald-200"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPhotoModalTarget({
                                      id: std.id,
                                      name: std.name,
                                      currentPhoto: std.photoUrl,
                                      type: 'student',
                                      gender: std.gender
                                    })
                                  }
                                  className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer"
                                  title="Ubah Foto Santri"
                                >
                                  <Camera className="w-3.5 h-3.5 text-emerald-300" />
                                </button>
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{std.name}</div>
                                <div className="text-[10px] text-slate-400">
                                  NISN: {std.nisn} • ({std.gender === 'L' ? 'L' : 'P'})
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {std.className}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => setQuickHalaqohStudent(std)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg font-bold text-[11px] border border-emerald-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer group"
                              title="Klik untuk ubah kelompok halaqoh santri ini"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[180px]">{std.halaqohGroup}</span>
                              <ArrowRightLeft className="w-2.5 h-2.5 text-emerald-500 group-hover:text-emerald-800 transition-colors shrink-0" />
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{std.parentName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{std.parentPhone}</div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setQuickHalaqohStudent(std)}
                                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Pindahkan Halaqoh Santri"
                              >
                                <ArrowRightLeft className="w-3 h-3 text-emerald-600" />
                                <span>Pindah Halaqoh</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setCardPreviewStudent(std)}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Pratinjau Kartu Santri"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA GURU (TEACHERS) */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          {/* Quick Excel helper bar */}
          <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-emerald-950">Isi Data Guru Otomatis via Excel:</span>
                <p className="text-[11px] text-emerald-700">
                  Upload file Excel (.xlsx / .csv) berisi daftar nama guru, NUPTK, mapel, dan no telepon untuk auto-fill data pengajar.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => downloadTeacherExcelTemplate()}
                className="px-3 py-1.5 bg-white hover:bg-emerald-100/50 text-emerald-900 border border-emerald-300 rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1.5 justify-center flex-1 sm:flex-none cursor-pointer"
                title="Unduh contoh template Excel resmi guru"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Template (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setExcelTargetType('teacher');
                  setIsExcelImportOpen(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1.5 justify-center flex-1 sm:flex-none shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File Excel</span>
              </button>
            </div>
          </div>

          {/* Duty Filter & Search Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Pilihan Tugas / Jabatan:</span>
              <select
                value={selectedTeacherDutyFilter}
                onChange={(e) => setSelectedTeacherDutyFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-800 focus:outline-emerald-600 cursor-pointer"
              >
                <option value="all">Semua Jabatan ({teachers.length})</option>
                {STAFF_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos} ({teachers.filter((t) => t.assignedDuty === pos || (!t.assignedDuty && t.position.toLowerCase().includes(pos.toLowerCase()))).length})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[11px] text-slate-500">
              Menampilkan <span className="font-bold text-emerald-800">{filteredTeachers.length}</span> dari {teachers.length} data pendidik
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Pendidik</th>
                  <th className="py-3 px-4">NUPTK / NIP</th>
                  <th className="py-3 px-4">Tugas & Jabatan</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((tch) => {
                  const isSelfTch = currentUser.relatedTeacherId === tch.id || currentUser.id === tch.id;
                  const canEditThisTch = canEditSchoolData || isSelfTch;
                  const duty = tch.assignedDuty || (tch.position.includes('Wali') ? 'Wali Kelas' : tch.position.includes('Kepala') ? 'Kepala Sekolah' : tch.position.includes('Halaqoh') ? 'Pembimbing Halaqoh' : 'Guru');

                  return (
                    <tr key={tch.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative group shrink-0">
                            <img
                              src={tch.photoUrl}
                              alt={tch.name}
                              className="w-11 h-11 rounded-xl object-cover border border-emerald-200"
                            />
                            {canEditThisTch && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPhotoModalTarget({
                                    id: tch.id,
                                    name: tch.name,
                                    currentPhoto: tch.photoUrl,
                                    type: 'teacher',
                                    gender: tch.gender
                                  })
                                }
                                className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer"
                                title="Klik untuk ubah foto guru"
                              >
                                <Camera className="w-4 h-4 text-emerald-300" />
                                <span>Foto</span>
                              </button>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{tch.name}</span>
                              {isSelfTch && (
                                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 font-bold text-[9px] rounded-md">
                                  Akun Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Pendidik TK Al Mishbah
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {tch.nuptk}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                            duty === 'Kepala Sekolah'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : duty === 'Wali Kelas'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : duty === 'Pembimbing Halaqoh'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {duty}
                          </span>
                        </div>
                        <div className="font-bold text-slate-700 text-xs">{tch.position}</div>
                        <div className="text-[10px] text-emerald-700">
                          {tch.teachingSubjects.join(', ')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {tch.phone}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {tch.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {tch.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEditThisTch ? (
                            <>
                              <button
                                onClick={() =>
                                  setPhotoModalTarget({
                                    id: tch.id,
                                    name: tch.name,
                                    currentPhoto: tch.photoUrl,
                                    type: 'teacher',
                                    gender: tch.gender
                                  })
                                }
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Ubah / Upload Foto Guru"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenTeacherModal(tch)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Guru"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 text-slate-300 rounded-lg cursor-not-allowed"
                              title="Pengeditan data guru hanya dapat dilakukan oleh Pemilik Akun, Kepala Sekolah, atau guru pemilik akun."
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}
                          {canEditSchoolData ? (
                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus data pendidik ${tch.name}?`)) {
                                  deleteTeacher(tch.id);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Guru"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 text-slate-300 rounded-lg cursor-not-allowed"
                              title="Hapus data guru hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah"
                            >
                              <Trash2 className="w-4 h-4 opacity-40" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DATA PEGAWAI (STAFF) */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {/* Duty Filter & Search Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Pilihan Tugas / Jabatan:</span>
              <select
                value={selectedStaffDutyFilter}
                onChange={(e) => setSelectedStaffDutyFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-800 focus:outline-emerald-600 cursor-pointer"
              >
                <option value="all">Semua Jabatan ({staff.length})</option>
                {STAFF_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos} ({staff.filter((s) => s.assignedDuty === pos || (!s.assignedDuty && ((s.position && s.position.toLowerCase().includes(pos.toLowerCase())) || s.department.toLowerCase().includes(pos.toLowerCase())) )).length})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[11px] text-slate-500">
              Menampilkan <span className="font-bold text-emerald-800">{filteredStaff.length}</span> dari {staff.length} data pegawai
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Pegawai</th>
                  <th className="py-3 px-4">NIP</th>
                  <th className="py-3 px-4">Tugas & Jabatan</th>
                  <th className="py-3 px-4">Divisi / Bagian</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((st) => {
                  const isSelfStaff = currentUser.relatedStaffId === st.id || currentUser.id === st.id;
                  const canEditThisStaff = canEditSchoolData || isSelfStaff;
                  const duty = st.assignedDuty || (st.department.includes('Keuangan') || st.department.includes('Keamanan') ? 'Karyawan' : 'Staff');

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative group shrink-0">
                            <img
                              src={st.photoUrl}
                              alt={st.name}
                              className="w-10 h-10 rounded-xl object-cover border border-emerald-200"
                            />
                            {canEditThisStaff && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPhotoModalTarget({
                                    id: st.id,
                                    name: st.name,
                                    currentPhoto: st.photoUrl,
                                    type: 'staff'
                                  })
                                }
                                className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer"
                                title="Klik untuk ubah foto pegawai"
                              >
                                <Camera className="w-4 h-4 text-emerald-300" />
                                <span>Foto</span>
                              </button>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{st.name}</span>
                              {isSelfStaff && (
                                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 font-bold text-[9px] rounded-md">
                                  Akun Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">Tenaga Kependidikan</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {st.nip}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                            duty === 'Karyawan'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : duty === 'Staff'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {duty}
                          </span>
                        </div>
                        <div className="font-bold text-slate-700 text-xs">{st.position || st.department}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {st.department}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {st.phone}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {st.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEditThisStaff ? (
                            <>
                              <button
                                onClick={() =>
                                  setPhotoModalTarget({
                                    id: st.id,
                                    name: st.name,
                                    currentPhoto: st.photoUrl,
                                    type: 'staff'
                                  })
                                }
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Ubah / Upload Foto Pegawai"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenStaffModal(st)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Pegawai"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 text-slate-300 rounded-lg cursor-not-allowed"
                              title="Pengeditan data pegawai hanya dapat dilakukan oleh Pemilik Akun, Kepala Sekolah, atau pegawai bersangkutan"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}
                          {canEditSchoolData ? (
                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus data staf ${st.name}?`)) {
                                  deleteStaff(st.id);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Pegawai"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 text-slate-300 rounded-lg cursor-not-allowed"
                              title="Hapus data pegawai hanya dapat dilakukan oleh Pemilik Akun dan Kepala Sekolah"
                            >
                              <Trash2 className="w-4 h-4 opacity-40" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* STUDENT ADD/EDIT MODAL */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-700" />
                {editingStudent ? 'Edit Data Santri' : 'Tambah Santri Baru'}
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 text-xs">
              {/* Photo Upload Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                <div className="relative group shrink-0">
                  <img
                    src={studentForm.photoUrl}
                    alt={studentForm.name || 'Santri'}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoModalTarget({
                        name: studentForm.name || 'Santri Baru',
                        currentPhoto: studentForm.photoUrl,
                        type: 'student',
                        gender: studentForm.gender,
                        isFormMode: true
                      })
                    }
                    className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Ubah Foto Santri"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 min-w-0 w-full space-y-1.5">
                  <div className="font-extrabold text-slate-800 text-xs">Foto Profil Santri</div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    Upload file foto perangkat, jepret via kamera, atau pilih avatar Islami
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <label className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                      <Upload className="w-3 h-3 text-emerald-700" />
                      <span>Pilih File Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDirectFileUpload(file, 'student');
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoModalTarget({
                          name: studentForm.name || 'Santri Baru',
                          currentPhoto: studentForm.photoUrl,
                          type: 'student',
                          gender: studentForm.gender,
                          isFormMode: true
                        })
                      }
                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Kamera & Avatar</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={studentForm.photoUrl}
                    onChange={(e) => setStudentForm({ ...studentForm, photoUrl: e.target.value })}
                    placeholder="Atau masukkan tautan URL gambar (https://...)"
                    className="w-full px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-emerald-600 font-mono text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Santri</label>
                  <input
                    type="text"
                    required
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    placeholder="Contoh: Muhammad Rayyan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Panggilan</label>
                  <input
                    type="text"
                    required
                    value={studentForm.nickName}
                    onChange={(e) => setStudentForm({ ...studentForm, nickName: e.target.value })}
                    placeholder="Contoh: Rayyan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NISN</label>
                  <input
                    type="text"
                    required
                    value={studentForm.nisn}
                    onChange={(e) => setStudentForm({ ...studentForm, nisn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas / Rombel</label>
                  <select
                    value={studentForm.className}
                    onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-bold"
                  >
                    <option value="TK A-1">TK A-1</option>
                    <option value="TK A-2">TK A-2</option>
                    <option value="TK B-1">TK B-1</option>
                    <option value="TK B-2">TK B-2</option>
                    <option value="Playgroup">Playgroup</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    required
                    value={studentForm.parentName}
                    onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                    placeholder="Nama Ayah / Bunda"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Wali</label>
                  <input
                    type="text"
                    required
                    value={studentForm.parentPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelompok Halaqoh Tahfidz</label>
                <select
                  value={studentForm.halaqohGroup}
                  onChange={(e) => setStudentForm({ ...studentForm, halaqohGroup: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-bold"
                >
                  {halaqohGroups.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name} ({g.mentorName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Rumah</label>
                <input
                  type="text"
                  value={studentForm.address}
                  onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                  placeholder="Alamat domisili santri..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Simpan Data Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER ADD/EDIT MODAL */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                {editingTeacher ? 'Edit Data Pendidik' : 'Tambah Guru Baru'}
              </h3>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-6 space-y-4 text-xs">
              {/* Photo Upload Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                <div className="relative group shrink-0">
                  <img
                    src={teacherForm.photoUrl}
                    alt={teacherForm.name || 'Guru'}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoModalTarget({
                        name: teacherForm.name || 'Guru Baru',
                        currentPhoto: teacherForm.photoUrl,
                        type: 'teacher',
                        gender: teacherForm.gender,
                        isFormMode: true
                      })
                    }
                    className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Ubah Foto Guru"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 min-w-0 w-full space-y-1.5">
                  <div className="font-extrabold text-slate-800 text-xs">Foto Profil Pendidik / Guru</div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    Upload file foto resmi dari perangkat, jepret via kamera, atau pilih avatar
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <label className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                      <Upload className="w-3 h-3 text-emerald-700" />
                      <span>Pilih File Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDirectFileUpload(file, 'teacher');
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoModalTarget({
                          name: teacherForm.name || 'Guru Baru',
                          currentPhoto: teacherForm.photoUrl,
                          type: 'teacher',
                          gender: teacherForm.gender,
                          isFormMode: true
                        })
                      }
                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Kamera & Avatar</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={teacherForm.photoUrl}
                    onChange={(e) => setTeacherForm({ ...teacherForm, photoUrl: e.target.value })}
                    placeholder="Atau URL gambar (https://...)"
                    className="w-full px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-emerald-600 font-mono text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  placeholder="Contoh: Ustadzah Fatimah Azzahra, S.Pd.I"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilihan Jabatan / Tugas Utama</label>
                  <select
                    required
                    value={teacherForm.assignedDuty}
                    onChange={(e) => {
                      const newDuty = e.target.value as StaffPosition;
                      setTeacherForm({
                        ...teacherForm,
                        assignedDuty: newDuty,
                        position: teacherForm.position === 'Guru' || teacherForm.position === 'Wali Kelas' || teacherForm.position === 'Kepala Sekolah' || teacherForm.position === 'Karyawan' || teacherForm.position === 'Staff' || teacherForm.position === 'Pembimbing Halaqoh' ? newDuty : teacherForm.position
                      });
                    }}
                    className="w-full px-3 py-2 bg-emerald-50/70 border border-emerald-300 rounded-xl focus:outline-emerald-600 font-bold text-emerald-950"
                  >
                    {STAFF_POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rincian Penugasan / Kelas</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.position}
                    onChange={(e) => setTeacherForm({ ...teacherForm, position: e.target.value })}
                    placeholder="Contoh: Wali Kelas TK A-1 & Sentra Balok"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NUPTK / NIP</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.nuptk}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nuptk: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Keaktifan</label>
                  <select
                    value={teacherForm.status}
                    onChange={(e) => setTeacherForm({ ...teacherForm, status: e.target.value as 'Aktif' | 'Cuti' | 'Izin' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-bold"
                  >
                    <option value="Aktif">Aktif Mengajar</option>
                    <option value="Cuti">Cuti Resmi (ACC Kepala Sekolah)</option>
                    <option value="Izin">Izin Sementara</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Simpan Data Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF ADD/EDIT MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-700" />
                {editingStaff ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
              </h3>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4 text-xs">
              {/* Photo Upload Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                <div className="relative group shrink-0">
                  <img
                    src={staffForm.photoUrl}
                    alt={staffForm.name || 'Pegawai'}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoModalTarget({
                        name: staffForm.name || 'Pegawai Baru',
                        currentPhoto: staffForm.photoUrl,
                        type: 'staff',
                        isFormMode: true
                      })
                    }
                    className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Ubah Foto Pegawai"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 min-w-0 w-full space-y-1.5">
                  <div className="font-extrabold text-slate-800 text-xs">Foto Profil Pegawai / Staf</div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    Upload file foto staf dari perangkat, jepret via kamera, atau pilih avatar
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <label className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                      <Upload className="w-3 h-3 text-emerald-700" />
                      <span>Pilih File Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDirectFileUpload(file, 'staff');
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoModalTarget({
                          name: staffForm.name || 'Pegawai Baru',
                          currentPhoto: staffForm.photoUrl,
                          type: 'staff',
                          isFormMode: true
                        })
                      }
                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Kamera & Avatar</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={staffForm.photoUrl}
                    onChange={(e) => setStaffForm({ ...staffForm, photoUrl: e.target.value })}
                    placeholder="Atau URL gambar (https://...)"
                    className="w-full px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-emerald-600 font-mono text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pegawai</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="Contoh: Bunda Siti Rahmawati, S.E"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilihan Jabatan / Tugas Utama</label>
                  <select
                    required
                    value={staffForm.assignedDuty}
                    onChange={(e) => {
                      const newDuty = e.target.value as StaffPosition;
                      setStaffForm({
                        ...staffForm,
                        assignedDuty: newDuty,
                        position: staffForm.position === 'Guru' || staffForm.position === 'Wali Kelas' || staffForm.position === 'Kepala Sekolah' || staffForm.position === 'Karyawan' || staffForm.position === 'Staff' || staffForm.position === 'Pembimbing Halaqoh' ? newDuty : staffForm.position
                      });
                    }}
                    className="w-full px-3 py-2 bg-emerald-50/70 border border-emerald-300 rounded-xl focus:outline-emerald-600 font-bold text-emerald-950"
                  >
                    {STAFF_POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rincian Jabatan / Tugas Spesifik</label>
                  <input
                    type="text"
                    required
                    value={staffForm.position}
                    onChange={(e) => setStaffForm({ ...staffForm, position: e.target.value })}
                    placeholder="Contoh: Karyawan Keuangan & Layanan SPP"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP Pegawai</label>
                  <input
                    type="text"
                    required
                    value={staffForm.nip}
                    onChange={(e) => setStaffForm({ ...staffForm, nip: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Divisi / Unit Kerja</label>
                  <input
                    type="text"
                    required
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    placeholder="Tata Usaha / Keuangan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Keaktifan</label>
                <select
                  value={staffForm.status}
                  onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value as 'Aktif' | 'Cuti' })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-bold"
                >
                  <option value="Aktif">Aktif Bekerja</option>
                  <option value="Cuti">Cuti Resmi (ACC Kepala Sekolah)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. Kontak / WA</label>
                <input
                  type="text"
                  required
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Simpan Data Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Card Modal Preview */}
      {cardPreviewStudent && (
        <StudentCardModal
          student={cardPreviewStudent}
          onClose={() => setCardPreviewStudent(null)}
        />
      )}

      {/* Batch / Single QR Card Generator & Print Modal */}
      {isQrGeneratorOpen && (
        <StudentQrCardGeneratorModal
          students={students}
          initialSelectedStudentId={qrGeneratorInitialId}
          onClose={() => setIsQrGeneratorOpen(false)}
        />
      )}

      {/* Excel Upload & Auto-fill Modal */}
      {isExcelImportOpen && (
        <ExcelImportModal
          isOpen={isExcelImportOpen}
          targetType={excelTargetType}
          onClose={() => setIsExcelImportOpen(false)}
        />
      )}

      {/* Photo Upload & Avatar Editor Modal for Guru, Karyawan, and Siswa */}
      {photoModalTarget && (
        <PhotoUploadModal
          isOpen={!!photoModalTarget}
          onClose={() => setPhotoModalTarget(null)}
          currentPhotoUrl={photoModalTarget.currentPhoto}
          entityName={photoModalTarget.name}
          entityType={photoModalTarget.type}
          gender={photoModalTarget.gender}
          title={`Ubah Foto - ${photoModalTarget.name}`}
          onSavePhoto={handleSavePhotoModal}
        />
      )}

      {/* QUICK SINGLE STUDENT HALAQOH SWITCH MODAL */}
      {quickHalaqohStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">Pindahkan Kelompok Halaqoh</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickHalaqohStudent(null)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Student info */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <img
                  src={quickHalaqohStudent.photoUrl}
                  alt={quickHalaqohStudent.name}
                  className="w-12 h-12 rounded-xl object-cover border border-emerald-300 shrink-0"
                />
                <div>
                  <h4 className="font-extrabold text-slate-900">{quickHalaqohStudent.name}</h4>
                  <p className="text-[11px] text-slate-600">
                    Kelas: <strong>{quickHalaqohStudent.className}</strong> • NISN: {quickHalaqohStudent.nisn}
                  </p>
                  <p className="text-[11px] text-emerald-800 font-bold mt-0.5">
                    Halaqoh Saat Ini: {quickHalaqohStudent.halaqohGroup}
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Pilih Kelompok Halaqoh Baru:
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {halaqohGroups.map((grp) => {
                    const isCurrent = quickHalaqohStudent.halaqohGroup === grp.name;
                    return (
                      <div
                        key={grp.id}
                        onClick={() => {
                          updateStudentHalaqoh(quickHalaqohStudent.id, grp.name);
                          addNotification({
                            title: 'Halaqoh Santri Diperbarui',
                            message: `Ananda ${quickHalaqohStudent.name} berhasil dipindahkan ke ${grp.name}.`,
                            type: 'success',
                            forRole: 'all',
                            linkTab: 'master-data'
                          });
                          setQuickHalaqohStudent(null);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isCurrent
                            ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950'
                            : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="text-xs font-bold">{grp.name}</div>
                            <div className="text-[10px] text-slate-500">
                              Musyrif: {grp.mentorName} • {grp.room}
                            </div>
                          </div>
                        </div>
                        {isCurrent ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 hover:underline">
                            Pilih
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setQuickHalaqohStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HALAQOH GROUP CREATE / EDIT MODAL */}
      {isHalaqohModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">
                  {editingHalaqoh ? 'Edit Info Kelompok Halaqoh' : 'Tambah Kelompok Halaqoh Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHalaqohModalOpen(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingHalaqoh) {
                  updateHalaqohGroup({
                    ...editingHalaqoh,
                    ...halaqohForm
                  });
                } else {
                  addHalaqohGroup(halaqohForm);
                }
                setIsHalaqohModalOpen(false);
              }}
              className="p-5 space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Kelompok Halaqoh
                </label>
                <input
                  type="text"
                  required
                  value={halaqohForm.name}
                  onChange={(e) => setHalaqohForm({ ...halaqohForm, name: e.target.value })}
                  placeholder="Contoh: Halaqoh 1 - Bintang (Juz Amma Awal)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Singkat</label>
                  <input
                    type="text"
                    required
                    value={halaqohForm.shortName}
                    onChange={(e) => setHalaqohForm({ ...halaqohForm, shortName: e.target.value })}
                    placeholder="Contoh: Halaqoh 1 - Bintang"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target / Level</label>
                  <input
                    type="text"
                    required
                    value={halaqohForm.targetLevel}
                    onChange={(e) => setHalaqohForm({ ...halaqohForm, targetLevel: e.target.value })}
                    placeholder="Contoh: Juz Amma Awal"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Pembimbing / Musyrif
                  </label>
                  <input
                    type="text"
                    required
                    value={halaqohForm.mentorName}
                    onChange={(e) => setHalaqohForm({ ...halaqohForm, mentorName: e.target.value })}
                    placeholder="Ustadzah Fatimah Azzahra, S.Pd.I"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Kontak / WA</label>
                  <input
                    type="text"
                    value={halaqohForm.mentorPhone}
                    onChange={(e) => setHalaqohForm({ ...halaqohForm, mentorPhone: e.target.value })}
                    placeholder="0812-3456-7890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ruangan / Tempat</label>
                  <input
                    type="text"
                    value={halaqohForm.room}
                    onChange={(e) => setHalaqohForm({ ...halaqohForm, room: e.target.value })}
                    placeholder="Masjid Al-Mishbah Lantai 1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Halaqoh</label>
                  <input
                    type="text"
                    value={halaqohForm.scheduleTime}
                    onChange={(e) => setHalaqohForm({ ...halaqohForm, scheduleTime: e.target.value })}
                    placeholder="08.00 - 09.15 WIB"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Fokus Hafalan & Karakter
                </label>
                <textarea
                  rows={2}
                  required
                  value={halaqohForm.focus}
                  onChange={(e) => setHalaqohForm({ ...halaqohForm, focus: e.target.value })}
                  placeholder="Contoh: Surah An-Nas s/d Al-Fil, Doa Sehari-hari & Karakter Qur'ani"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHalaqohModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingHalaqoh ? 'Simpan Perubahan' : 'Buat Kelompok'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO UPLOAD & AVATAR EDITOR MODAL */}
      {photoModalTarget && (
        <PhotoUploadModal
          isOpen={!!photoModalTarget}
          onClose={() => setPhotoModalTarget(null)}
          currentPhotoUrl={photoModalTarget.currentPhoto}
          entityName={photoModalTarget.name}
          entityType={photoModalTarget.type}
          gender={photoModalTarget.gender}
          onSavePhoto={handleSavePhotoModal}
        />
      )}
    </div>
  );
};
