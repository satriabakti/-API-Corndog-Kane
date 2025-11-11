export enum MeritalStatus {
  SINGLE = "SINGLE",
  MARRIED = "MARRIED",
  DIVORCED = "DIVORCED",
  WIDOWED = "WIDOWED"
}

export enum BloodType {
  A = "A",
  B = "B",
  AB = "AB",
  O = "O"
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE"
}

export type TEmployee = {
  id: string;
  name: string;
  phone: string;
  nik: string;
  address: string;
  provinceId: bigint;
  cityId: bigint;
  districtId: bigint;
  subdistrictId: bigint;
  meritalStatus: MeritalStatus;
  religion: string;
  birthDate: Date;
  birthPlace: string;
  bloodType: BloodType;
  rt: string;
  rw: string;
  workType: string;
  position: string;
  notes?: string;
  imagePath: string;
  gender: Gender;
  hireDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TEmployeeCreate = Omit<TEmployee, "id" | "createdAt" | "updatedAt">;

export type TEmployeeCreateRequest = Omit<TEmployee, "id" | "createdAt" | "updatedAt" | "isActive" | "provinceId" | "cityId" | "districtId" | "subdistrictId" | "meritalStatus" | "birthDate" | "birthPlace" | "bloodType" | "workType" | "imagePath" | "hireDate"> & {
  is_active?: boolean;
  province_id: bigint;
  city_id: bigint;
  district_id: bigint;
  subdistrict_id: bigint;
  merital_status: MeritalStatus;
  birth_date: Date;
  birth_place: string;
  blood_type: BloodType;
  work_type: string;
  image_path: string;
  hire_date: Date;
}

export type TEmployeeUpdateRequest = Partial<TEmployeeCreateRequest>;

export type TEmployeeGetResponse = Omit<TEmployee, "isActive" | "createdAt" | "updatedAt" | "provinceId" | "cityId" | "districtId" | "subdistrictId" | "meritalStatus" | "birthDate" | "birthPlace" | "bloodType" | "workType" | "imagePath" | "hireDate"> & {
  is_active: boolean;
  province_id: bigint;
  city_id: bigint;
  district_id: bigint;
  subdistrict_id: bigint;
  merital_status: MeritalStatus;
  birth_date: Date;
  birth_place: string;
  blood_type: BloodType;
  work_type: string;
  image_path: string;
  hire_date: Date;
  created_at: Date;
  updated_at: Date;
}
