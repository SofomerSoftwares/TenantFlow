export type UserRole = 'Admin' | 'Staff' | 'Viewer';

export interface UserNotificationPreferences {
  emailAlerts: boolean;
  reconciliationCompleted: boolean;
  discrepancyAlerts: boolean;
  approvalRequests: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  avatarColor?: string;
  jobTitle?: string;
  department?: string;
  branch?: string;
  phone?: string;
  bio?: string;
  language?: 'en' | 'am';
  joinedDate?: string;
  lastActive?: string;
  notifications?: UserNotificationPreferences;
}

export type RecordChangeType = 'NEW' | 'UPDATED' | 'UNCHANGED' | 'MISSING' | 'DUPLICATE' | 'ERROR';

export type MissingTenantAction = 'keep' | 'deactivate' | 'remove';

export interface PropertyRegistryRecord {
  // Identification & Administrative Hierarchy
  id?: number | string;
  identifier_code: string;                          // መለያ (Identifier)
  city?: string;                                    // ከተማ (City)
  sub_city?: string;                                // ክ/ከተማ (Sub-City)
  woreda?: string;                                  // ወረዳ (Woreda)
  kebele?: string;                                  // ቀበሌ (Kebele)
  house_number?: string;                            // ቤት ቁጥር (House No.)
  complex_no?: string;                              // የኮምፕሌክስ ወ./ቁጥር (Complex No.)

  // Occupant Details
  title?: string;                                   // ማዕረግ (Title)
  tenant_name: string;                             // የተከራይ ስም / TENANT
  resident_name?: string;                           // የነዋሪ ስም / NAME OF RESIDENT
  gender?: string;                                  // ጾታ (Gender)

  // Property Structure & Usage
  historical_use?: string;                          // የቤት ታሪካዊ አገልግሎት (Historical Use)
  main_house?: string;                              // ዋና ቤት (Main House)
  bedroom_count?: number;                           // የመኝታ ክፍል (Bedrooms)
  bathroom_count?: number;                          // የመታጠቢያ ክፍል (Bathrooms)
  kitchen_count?: number;                           // የኪችን ክፍል (Kitchen)
  service_room_count?: number;                      // የሰርቪስ ቤት (Service Rooms)
  other_rooms_count?: number;                       // ሌላ ክፍል (Other Rooms)
  total_rooms?: number;                             // ጠቅላላ የክፍል ብዛት (Total Rooms)

  // Grading & Classification
  floor_level?: string;                             // የወለል ደረጃ (Floor Level / Story)
  building_grade?: string;                          // የቤቱ ደረጃ (Building Standard / Grade)
  site_grade?: string;                              // የቦታ ደረጃ (Site / Location Grade)

  // Cadastral & Area Information
  block_no?: string;                                // ብሎክ ቁጥር (Block No.)
  parcel_no?: string;                               // ፓርሰል ቁጥር (Parcel No.)
  area_sqm?: number;                                // ስፋት (Area in m²)
  rent_amount?: number;                             // የኪራይ መጠን (Rent Amount)
  year_built?: number;                              // የተገነባበት ዓ.ም (Year Built)
  year_renovated?: number;                          // የታደሰበት ዓ.ም (Year Renovated)
  tenure_type?: string;                             // የይዞታ ዓይነት/ሁኔታ (Tenure Type)
  work_status?: string;                             // የስራ ዓይነት/ሁኔታ (Work / Status)

  // Spatial & Contact Details
  x_coordinate?: number;                            // X COORDINATE
  y_coordinate?: number;                            // Y COORDINATE
  house_location?: string;                          // የቤቱ መገኛ (Location Description)
  mobile_phone?: string;                            // Mobile
  remarks?: string;                                 // Remark

  // System & Compatibility Fields
  tenantCode: string;                               // Maps to identifier_code
  tenantName: string;                               // Maps to tenant_name
  unit: string;                                     // Maps to house_number
  branch?: string;                                  // Maps to sub_city
  floor?: string;                                   // Maps to floor_level
  phone?: string;                                   // Maps to mobile_phone
  email?: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Terminated' | string;
  rent?: number | string;                           // Maps to rent_amount
  contractStart?: string;
  contractEnd?: string;
  category?: string;                                // Maps to historical_use
  typology?: string;                                // Building typology for Form 02 (e.g. apartment, villa, shenshan)
  rawFields: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export type TenantRecord = PropertyRegistryRecord;

export const PROPERTY_REGISTRY_FIELD_LABELS: Record<string, { en: string; am: string }> = {
  identifier_code: { en: 'Identifier Code', am: 'መለያ' },
  city: { en: 'City', am: 'ከተማ' },
  sub_city: { en: 'Sub-City', am: 'ክ/ከተማ' },
  woreda: { en: 'Woreda', am: 'ወረዳ' },
  kebele: { en: 'Kebele', am: 'ቀበሌ' },
  house_number: { en: 'House Number', am: 'ቤት ቁጥር' },
  complex_no: { en: 'Complex No.', am: 'የኮምፕሌክስ ወ./ቁጥር' },
  title: { en: 'Title', am: 'ማዕረግ' },
  tenant_name: { en: 'Tenant Name', am: 'የተከራይ ስም' },
  resident_name: { en: 'Resident Name', am: 'የነዋሪ ስም' },
  gender: { en: 'Gender', am: 'ጾታ' },
  historical_use: { en: 'Historical Use', am: 'የቤት ታሪካዊ አገልግሎት' },
  main_house: { en: 'Main House', am: 'ዋና ቤት' },
  bedroom_count: { en: 'Bedrooms', am: 'የመኝታ ክፍል' },
  bathroom_count: { en: 'Bathrooms', am: 'የመታጠቢያ ክፍል' },
  kitchen_count: { en: 'Kitchen', am: 'የኪችን ክፍል' },
  service_room_count: { en: 'Service Rooms', am: 'የሰርቪስ ቤት' },
  other_rooms_count: { en: 'Other Rooms', am: 'ሌላ ክፍል' },
  total_rooms: { en: 'Total Rooms', am: 'ጠቅላላ የክፍል ብዛት' },
  floor_level: { en: 'Floor Level', am: 'የወለል ደረጃ' },
  building_grade: { en: 'Building Grade', am: 'የቤቱ ደረጃ' },
  site_grade: { en: 'Site Grade', am: 'የቦታ ደረጃ' },
  block_no: { en: 'Block No.', am: 'ብሎክ ቁጥር' },
  parcel_no: { en: 'Parcel No.', am: 'ፓርሰል ቁጥር' },
  area_sqm: { en: 'Area (m²)', am: 'ስፋት' },
  rent_amount: { en: 'Rent Amount', am: 'የኪራይ መጠን' },
  year_built: { en: 'Year Built', am: 'የተገነባበት ዓ.ም' },
  year_renovated: { en: 'Year Renovated', am: 'የታደሰበት ዓ.ም' },
  tenure_type: { en: 'Tenure Type', am: 'የይዞታ ዓይነት/ሁኔታ' },
  work_status: { en: 'Work Status', am: 'የስራ ዓይነት/ሁኔታ' },
  x_coordinate: { en: 'X Coordinate', am: 'X COORDINATE' },
  y_coordinate: { en: 'Y Coordinate', am: 'Y COORDINATE' },
  house_location: { en: 'House Location', am: 'የቤቱ መገኛ' },
  mobile_phone: { en: 'Mobile Phone', am: 'ስልክ' },
  remarks: { en: 'Remarks', am: 'ማስታወሻ' }
};

export interface FieldDiff {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
  isChanged: boolean;
}

export interface TenantComparisonItem {
  id: string;
  tenantCode: string;
  tenantName: string;
  changeType: RecordChangeType;
  diffs: FieldDiff[];
  masterRecord?: TenantRecord;
  newRecord?: TenantRecord;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  missingAction?: MissingTenantAction;
  issues?: string[];
  rowNumber?: number;
  heuristicTag?: string;
}

export interface HeuristicRule {
  id: string;
  name: string;
  category: 'naming' | 'phone' | 'financial' | 'status' | 'lifecycle' | 'formatting';
  description: string;
  confidence: number;
  suggestedAction: 'approve' | 'reject' | 'deactivate' | 'keep';
  itemCount: number;
  sampleItems: {
    tenantCode: string;
    tenantName: string;
    field: string;
    oldValue: any;
    newValue: any;
    explanation: string;
  }[];
  matchedItemIds: string[];
}

export interface ComparisonSummary {
  totalMaster: number;
  totalNew: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  missingCount: number;
  duplicateCount: number;
  errorCount: number;
}

export interface ColumnMapping {
  tenantCode: string;
  identifierCode?: string;
  tenantName?: string;
  unit?: string;
  branch?: string;
  floor?: string;
  phone?: string;
  email?: string;
  status?: string;
  rent?: string;
  contractStart?: string;
  contractEnd?: string;
  category?: string;

  // Property Registry fields
  city?: string;
  subCity?: string;
  woreda?: string;
  kebele?: string;
  houseNumber?: string;
  complexNo?: string;
  title?: string;
  residentName?: string;
  gender?: string;
  historicalUse?: string;
  mainHouse?: string;
  bedroomCount?: string;
  bathroomCount?: string;
  kitchenCount?: string;
  serviceRoomCount?: string;
  otherRoomsCount?: string;
  totalRooms?: string;
  floorLevel?: string;
  buildingGrade?: string;
  siteGrade?: string;
  blockNo?: string;
  parcelNo?: string;
  areaSqm?: string;
  rentAmount?: string;
  yearBuilt?: string;
  yearRenovated?: string;
  tenureType?: string;
  workStatus?: string;
  xCoordinate?: string;
  yCoordinate?: string;
  houseLocation?: string;
  mobilePhone?: string;
  remarks?: string;

  [key: string]: string | undefined;
}

export interface UploadSession {
  id: string;
  createdAt: string;
  masterFileName: string;
  newFileName: string;
  summary: ComparisonSummary;
  appliedAt?: string;
  appliedBy?: string;
  status: 'draft' | 'applied' | 'discarded';
}

export interface TenantHistoryItem {
  id: string;
  tenantCode: string;
  tenantName: string;
  field: string;
  oldValue: string;
  newValue: string;
  changeType: string;
  updatedBy: string;
  updatedDate: string;
  sessionId: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
}

export interface ParsedExcelFile {
  fileName: string;
  fileSize: number;
  fileSizeBytes: number;
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  detectedMapping: ColumnMapping;
  isTenantCodeDetected: boolean;
}
