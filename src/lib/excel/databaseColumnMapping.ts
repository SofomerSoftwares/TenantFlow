import { ColumnMapping } from '@/src/types/tenant';

export interface DBColumnDefinition {
  key: string;
  dbColumn: string;
  sqlType: string;
  sqlConstraint: 'PRIMARY KEY' | 'NOT NULL' | 'DEFAULT 0' | 'NULLABLE';
  labelEn: string;
  labelAm: string;
  category: 'hierarchy' | 'occupant' | 'structure' | 'grading' | 'spatial';
  categoryLabel: string;
  hint: string;
  required?: boolean;
}

export const PROPERTY_REGISTRY_COLUMNS: DBColumnDefinition[] = [
  // 1. Identification & Hierarchy
  {
    key: 'tenantCode',
    dbColumn: 'identifier_code',
    sqlType: 'VARCHAR(50)',
    sqlConstraint: 'PRIMARY KEY',
    labelEn: 'Identifier Code',
    labelAm: 'መለያ',
    category: 'hierarchy',
    categoryLabel: 'Administrative Hierarchy',
    hint: 'Primary unique key (e.g. ETH-AA-BOL-101, መለያ, Code). Must be unique per property.',
    required: true
  },
  {
    key: 'city',
    dbColumn: 'city',
    sqlType: 'VARCHAR(100)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'City',
    labelAm: 'ከተማ',
    category: 'hierarchy',
    categoryLabel: 'Administrative Hierarchy',
    hint: 'Administrative municipality (e.g. Addis Ababa, ከተማ)'
  },
  {
    key: 'subCity',
    dbColumn: 'sub_city',
    sqlType: 'VARCHAR(100)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Sub-City (Branch)',
    labelAm: 'ክ/ከተማ',
    category: 'hierarchy',
    categoryLabel: 'Administrative Hierarchy',
    hint: 'Municipal sub-city or branch (e.g. Bole, Kirkos, Yeka, Arada, Lideta, ክ/ከተማ)'
  },
  {
    key: 'woreda',
    dbColumn: 'woreda',
    sqlType: 'VARCHAR(50)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Woreda (District)',
    labelAm: 'ወረዳ',
    category: 'hierarchy',
    categoryLabel: 'Administrative Hierarchy',
    hint: 'Administrative district (e.g. Woreda 03, Woreda 08, ወረዳ)'
  },
  {
    key: 'kebele',
    dbColumn: 'kebele',
    sqlType: 'VARCHAR(50)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Kebele (Neighborhood)',
    labelAm: 'ቀበሌ',
    category: 'hierarchy',
    categoryLabel: 'Administrative Hierarchy',
    hint: 'Neighborhood / Kebele jurisdiction (e.g. Kebele 08, Kebele 14, ቀበሌ)'
  },
  {
    key: 'houseNumber',
    dbColumn: 'house_number',
    sqlType: 'VARCHAR(50)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'House Number (Unit)',
    labelAm: 'ቤት ቁጥር',
    category: 'hierarchy',
    categoryLabel: 'Administrative Hierarchy',
    hint: 'Municipal house number or apartment unit (e.g. B3/101, K5/205, Unit 4B, ቤት ቁጥር)'
  },
  {
    key: 'complexNo',
    dbColumn: 'complex_no',
    sqlType: 'VARCHAR(50)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Complex No.',
    labelAm: 'የኮምፕሌክስ ወ./ቁጥር',
    category: 'hierarchy',
    categoryLabel: 'Administrative Hierarchy',
    hint: 'Commercial building or complex identifier (e.g. CMP-01, CMP-05, ኮምፕሌክስ)'
  },

  // 2. Occupant Details
  {
    key: 'title',
    dbColumn: 'title',
    sqlType: 'VARCHAR(50)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Title / Honorific',
    labelAm: 'ማዕረግ',
    category: 'occupant',
    categoryLabel: 'Occupant Details',
    hint: 'Honorific / Salutation (e.g. Ato, W/ro, Dr., Eng., ማዕረግ)'
  },
  {
    key: 'tenantName',
    dbColumn: 'tenant_name',
    sqlType: 'VARCHAR(255)',
    sqlConstraint: 'NOT NULL',
    labelEn: 'Tenant Name (Occupant)',
    labelAm: 'የተከራይ ስም / TENANT',
    category: 'occupant',
    categoryLabel: 'Occupant Details',
    hint: 'Legal tenant or corporate organization name (e.g. Abebe Kebede, Ethio Telecom, የተከራይ ስም)',
    required: true
  },
  {
    key: 'residentName',
    dbColumn: 'resident_name',
    sqlType: 'VARCHAR(255)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Resident Name',
    labelAm: 'የነዋሪ ስም / RESIDENT',
    category: 'occupant',
    categoryLabel: 'Occupant Details',
    hint: 'Actual resident occupant if different from contract holder (e.g. የነዋሪ ስም)'
  },
  {
    key: 'gender',
    dbColumn: 'gender',
    sqlType: 'VARCHAR(10)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Gender',
    labelAm: 'ጾታ',
    category: 'occupant',
    categoryLabel: 'Occupant Details',
    hint: 'Gender of primary occupant (e.g. M, F, ወንድ, ሴት, ጾታ)'
  },
  {
    key: 'mobilePhone',
    dbColumn: 'mobile_phone',
    sqlType: 'VARCHAR(30)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Mobile / Phone',
    labelAm: 'Mobile / ስልክ',
    category: 'occupant',
    categoryLabel: 'Occupant Details',
    hint: 'Official mobile or telephone contact (e.g. +251 911 223344, Mobile, ስልክ)'
  },
  {
    key: 'workStatus',
    dbColumn: 'work_status',
    sqlType: 'VARCHAR(100)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Work / Lease Status',
    labelAm: 'የስራ ዓይነት/ሁኔታ',
    category: 'occupant',
    categoryLabel: 'Occupant Details',
    hint: 'Occupancy or lease status (e.g. Active, Active Commercial, Inactive, ሁኔታ)'
  },

  // 3. Property Structure & Usage
  {
    key: 'historicalUse',
    dbColumn: 'historical_use',
    sqlType: 'VARCHAR(255)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Historical Use (Category)',
    labelAm: 'የቤት ታሪካዊ አገልግሎት',
    category: 'structure',
    categoryLabel: 'Property Structure & Usage',
    hint: 'Designated zoning / building use (e.g. Commercial / Office, Retail / Pharmacy, Residential)'
  },
  {
    key: 'mainHouse',
    dbColumn: 'main_house',
    sqlType: 'VARCHAR(50)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Main House',
    labelAm: 'ዋና ቤት',
    category: 'structure',
    categoryLabel: 'Property Structure & Usage',
    hint: 'Main building designation (e.g. Main, Main House, Heritage House, ዋና ቤት)'
  },
  {
    key: 'totalRooms',
    dbColumn: 'total_rooms',
    sqlType: 'INT',
    sqlConstraint: 'DEFAULT 0',
    labelEn: 'Total Rooms',
    labelAm: 'ጠቅላላ የክፍል ብዛት',
    category: 'structure',
    categoryLabel: 'Property Structure & Usage',
    hint: 'Total room count across all wings (e.g. 5, 7, 11, ጠቅላላ ክፍል)'
  },
  {
    key: 'bedroomCount',
    dbColumn: 'bedroom_count',
    sqlType: 'INT',
    sqlConstraint: 'DEFAULT 0',
    labelEn: 'Bedrooms',
    labelAm: 'የመኝታ ክፍል',
    category: 'structure',
    categoryLabel: 'Property Structure & Usage',
    hint: 'Number of dedicated bedrooms (e.g. 1, 2, 3, 4, የመኝታ ክፍል)'
  },
  {
    key: 'bathroomCount',
    dbColumn: 'bathroom_count',
    sqlType: 'INT',
    sqlConstraint: 'DEFAULT 0',
    labelEn: 'Bathrooms',
    labelAm: 'የመታጠቢያ ክፍል',
    category: 'structure',
    categoryLabel: 'Property Structure & Usage',
    hint: 'Number of bathrooms / washrooms (e.g. 1, 2, 3, የመታጠቢያ ክፍል)'
  },
  {
    key: 'kitchenCount',
    dbColumn: 'kitchen_count',
    sqlType: 'INT',
    sqlConstraint: 'DEFAULT 0',
    labelEn: 'Kitchen',
    labelAm: 'የኪችን ክፍል',
    category: 'structure',
    categoryLabel: 'Property Structure & Usage',
    hint: 'Kitchen facility count (e.g. 1, የኪችን ክፍል, ኩሽና)'
  },
  {
    key: 'serviceRoomCount',
    dbColumn: 'service_room_count',
    sqlType: 'INT',
    sqlConstraint: 'DEFAULT 0',
    labelEn: 'Service Rooms',
    labelAm: 'የሰርቪስ ቤት',
    category: 'structure',
    categoryLabel: 'Property Structure & Usage',
    hint: 'External outbuilding / servant quarters (e.g. 1, 2, የሰርቪስ ቤት)'
  },
  {
    key: 'otherRoomsCount',
    dbColumn: 'other_rooms_count',
    sqlType: 'INT',
    sqlConstraint: 'DEFAULT 0',
    labelEn: 'Other Rooms',
    labelAm: 'ሌላ ክፍል',
    category: 'structure',
    categoryLabel: 'Property Structure & Usage',
    hint: 'Storage rooms, utility or miscellaneous spaces (e.g. 0, 1, ሌላ ክፍል)'
  },

  // 4. Cadastre, Grading & Rent
  {
    key: 'floorLevel',
    dbColumn: 'floor_level',
    sqlType: 'VARCHAR(50)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Floor Level / Story',
    labelAm: 'የወለል ደረጃ / Story',
    category: 'grading',
    categoryLabel: 'Cadastre, Grading & Rent',
    hint: 'Story or floor level (e.g. Ground Floor, 1st Floor, 2nd Floor, ደረጃ)'
  },
  {
    key: 'buildingGrade',
    dbColumn: 'building_grade',
    sqlType: 'VARCHAR(50)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Building Grade',
    labelAm: 'የቤቱ ደረጃ / Standard',
    category: 'grading',
    categoryLabel: 'Cadastre, Grading & Rent',
    hint: 'Engineering building standard (e.g. Grade A, Grade B+, Grade C, ደረጃ)'
  },
  {
    key: 'siteGrade',
    dbColumn: 'site_grade',
    sqlType: 'VARCHAR(50)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Site Grade',
    labelAm: 'የቦታ ደረጃ / Location Grade',
    category: 'grading',
    categoryLabel: 'Cadastre, Grading & Rent',
    hint: 'Urban location grade (e.g. Prime, Secondary, Commercial Corridor)'
  },
  {
    key: 'blockNo',
    dbColumn: 'block_no',
    sqlType: 'VARCHAR(50)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Block No.',
    labelAm: 'ብሎክ ቁጥር',
    category: 'grading',
    categoryLabel: 'Cadastre, Grading & Rent',
    hint: 'Cadastral block identifier (e.g. B-12, B-21, ብሎክ ቁጥር)'
  },
  {
    key: 'parcelNo',
    dbColumn: 'parcel_no',
    sqlType: 'VARCHAR(50)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Parcel No.',
    labelAm: 'ፓርሰል ቁጥር',
    category: 'grading',
    categoryLabel: 'Cadastre, Grading & Rent',
    hint: 'Cadastral parcel identifier (e.g. P-401, P-215, ፓርሰል ቁጥር)'
  },
  {
    key: 'areaSqm',
    dbColumn: 'area_sqm',
    sqlType: 'NUMERIC(10, 2)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Area (m²)',
    labelAm: 'ስፋት',
    category: 'grading',
    categoryLabel: 'Cadastre, Grading & Rent',
    hint: 'Total floor area in square meters (e.g. 145.50, 98.00, ስፋት)'
  },
  {
    key: 'rentAmount',
    dbColumn: 'rent_amount',
    sqlType: 'NUMERIC(12, 2)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Rent Amount (ETB)',
    labelAm: 'የኪራይ መጠን',
    category: 'grading',
    categoryLabel: 'Cadastre, Grading & Rent',
    hint: 'Monthly base rental amount in ETB / Birr (e.g. 45000.00, 32000.00, የኪራይ መጠን)'
  },
  {
    key: 'yearBuilt',
    dbColumn: 'year_built',
    sqlType: 'INT',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Year Built',
    labelAm: 'የተገነባበት ዓ.ም',
    category: 'grading',
    categoryLabel: 'Cadastre, Grading & Rent',
    hint: 'Original construction year (e.g. 2012, 2014, የተገነባበት)'
  },
  {
    key: 'yearRenovated',
    dbColumn: 'year_renovated',
    sqlType: 'INT',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Year Renovated',
    labelAm: 'የታደሰበት ዓ.ም',
    category: 'grading',
    categoryLabel: 'Cadastre, Grading & Rent',
    hint: 'Most recent renovation year (e.g. 2021, 2022, የታደሰበት)'
  },
  {
    key: 'tenureType',
    dbColumn: 'tenure_type',
    sqlType: 'VARCHAR(100)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Tenure Type',
    labelAm: 'የይዞታ ዓይነት/ሁኔታ',
    category: 'grading',
    categoryLabel: 'Cadastre, Grading & Rent',
    hint: 'Legal property holding tenure (e.g. Rented State Property, Kebele Housing, Private Lease)'
  },

  // 5. Spatial GIS & Remarks
  {
    key: 'xCoordinate',
    dbColumn: 'x_coordinate',
    sqlType: 'NUMERIC(12, 6)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'X Coordinate (Longitude)',
    labelAm: 'X COORDINATE',
    category: 'spatial',
    categoryLabel: 'Spatial GIS & Location',
    hint: 'GIS Longitude coordinate (e.g. 38.789201, Longitude)'
  },
  {
    key: 'yCoordinate',
    dbColumn: 'y_coordinate',
    sqlType: 'NUMERIC(12, 6)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Y Coordinate (Latitude)',
    labelAm: 'Y COORDINATE',
    category: 'spatial',
    categoryLabel: 'Spatial GIS & Location',
    hint: 'GIS Latitude coordinate (e.g. 8.998312, Latitude)'
  },
  {
    key: 'houseLocation',
    dbColumn: 'house_location',
    sqlType: 'VARCHAR(255)',
    sqlConstraint: 'NULLABLE',
    labelEn: 'House Location / Address',
    labelAm: 'የቤቱ መገኛ',
    category: 'spatial',
    categoryLabel: 'Spatial GIS & Location',
    hint: 'Descriptive address / Landmark (e.g. Bole Medhanialem Road, Near Edna Mall, የቤቱ መገኛ)'
  },
  {
    key: 'remarks',
    dbColumn: 'remarks',
    sqlType: 'TEXT',
    sqlConstraint: 'NULLABLE',
    labelEn: 'Remarks / Notes',
    labelAm: 'Remark / ማስታወሻ',
    category: 'spatial',
    categoryLabel: 'Spatial GIS & Location',
    hint: 'Administrative annotations or registry audit notes (e.g. Verified record, ማስታወሻ)'
  }
];

// Presets based on database structure
export const PRESETS_DATABASE_STRUCTURE = {
  // Preset 1: Standard Registry Column Names
  sqlDirect: {
    name: 'Standard Registry Format',
    description: 'Directly maps standard property registry column names (snake_case)',
    mapping: {
      tenantCode: 'identifier_code',
      identifierCode: 'identifier_code',
      city: 'city',
      subCity: 'sub_city',
      branch: 'sub_city',
      woreda: 'woreda',
      kebele: 'kebele',
      houseNumber: 'house_number',
      unit: 'house_number',
      complexNo: 'complex_no',
      title: 'title',
      tenantName: 'tenant_name',
      residentName: 'resident_name',
      gender: 'gender',
      historicalUse: 'historical_use',
      category: 'historical_use',
      mainHouse: 'main_house',
      bedroomCount: 'bedroom_count',
      bathroomCount: 'bathroom_count',
      kitchenCount: 'kitchen_count',
      serviceRoomCount: 'service_room_count',
      otherRoomsCount: 'other_rooms_count',
      totalRooms: 'total_rooms',
      floorLevel: 'floor_level',
      floor: 'floor_level',
      buildingGrade: 'building_grade',
      siteGrade: 'site_grade',
      blockNo: 'block_no',
      parcelNo: 'parcel_no',
      areaSqm: 'area_sqm',
      rentAmount: 'rent_amount',
      rent: 'rent_amount',
      yearBuilt: 'year_built',
      yearRenovated: 'year_renovated',
      tenureType: 'tenure_type',
      workStatus: 'work_status',
      status: 'work_status',
      xCoordinate: 'x_coordinate',
      yCoordinate: 'y_coordinate',
      houseLocation: 'house_location',
      mobilePhone: 'mobile_phone',
      phone: 'mobile_phone',
      remarks: 'remarks'
    } as ColumnMapping
  },

  // Preset 2: Amharic / Ethiopian Cadastral Registry
  amharicCadastral: {
    name: 'Ethiopian Cadastral Registry (Amharic)',
    description: 'Standard Amharic property registry labels (መለያ, ከተማ, ክ/ከተማ, ወረዳ, ቀበሌ, ቤት ቁጥር, ስፋት, የኪራይ መጠን)',
    mapping: {
      tenantCode: 'መለያ (Identifier)',
      identifierCode: 'መለያ (Identifier)',
      city: 'ከተማ (City)',
      subCity: 'ክ/ከተማ (Sub-City)',
      branch: 'ክ/ከተማ (Sub-City)',
      woreda: 'ወረዳ (Woreda)',
      kebele: 'ቀበሌ (Kebele)',
      houseNumber: 'ቤት ቁጥር (House No.)',
      unit: 'ቤት ቁጥር (House No.)',
      complexNo: 'የኮምፕሌክስ ወ./ቁጥር (Complex No.)',
      title: 'ማዕረግ (Title)',
      tenantName: 'የተከራይ ስም (Tenant Name)',
      residentName: 'የነዋሪ ስም (Resident Name)',
      gender: 'ጾታ (Gender)',
      historicalUse: 'የቤት ታሪካዊ አገልግሎት (Historical Use)',
      category: 'የቤት ታሪካዊ አገልግሎት (Historical Use)',
      mainHouse: 'ዋና ቤት (Main House)',
      bedroomCount: 'የመኝታ ክፍል (Bedrooms)',
      bathroomCount: 'የመታጠቢያ ክፍል (Bathrooms)',
      kitchenCount: 'የኪችን ክፍል (Kitchen)',
      serviceRoomCount: 'የሰርቪስ ቤት (Service Rooms)',
      otherRoomsCount: 'ሌላ ክፍል (Other Rooms)',
      totalRooms: 'ጠቅላላ የክፍል ብዛት (Total Rooms)',
      floorLevel: 'የወለል ደረጃ (Floor Level)',
      floor: 'የወለል ደረጃ (Floor Level)',
      buildingGrade: 'የቤቱ ደረጃ (Building Grade)',
      siteGrade: 'የቦታ ደረጃ (Site Grade)',
      blockNo: 'ብሎክ ቁጥር (Block No.)',
      parcelNo: 'ፓርሰል ቁጥር (Parcel No.)',
      areaSqm: 'ስፋት (Area in m²)',
      rentAmount: 'የኪራይ መጠን (Rent Amount ETB)',
      rent: 'የኪራይ መጠን (Rent Amount ETB)',
      yearBuilt: 'የተገነባበት ዓ.ም (Year Built)',
      yearRenovated: 'የታደሰበት ዓ.ም (Year Renovated)',
      tenureType: 'የይዞታ ዓይነት/ሁኔታ (Tenure Type)',
      workStatus: 'የስራ ዓይነት/ሁኔታ (Work Status)',
      status: 'የስራ ዓይነት/ሁኔታ (Work Status)',
      xCoordinate: 'X COORDINATE',
      yCoordinate: 'Y COORDINATE',
      houseLocation: 'የቤቱ መገኛ (House Location)',
      mobilePhone: 'Mobile',
      phone: 'Mobile',
      remarks: 'Remark'
    } as ColumnMapping
  },

  // Preset 3: Commercial Property ERP
  propertyErp: {
    name: 'Commercial Property ERP (Standard)',
    description: 'Conventional English property management system export columns',
    mapping: {
      tenantCode: 'Tenant Code',
      identifierCode: 'Tenant Code',
      city: 'City',
      subCity: 'Branch',
      branch: 'Branch',
      woreda: 'Woreda',
      kebele: 'Kebele',
      houseNumber: 'Unit',
      unit: 'Unit',
      complexNo: 'Complex',
      title: 'Title',
      tenantName: 'Tenant Name',
      residentName: 'Resident Name',
      gender: 'Gender',
      historicalUse: 'Category',
      category: 'Category',
      mainHouse: 'Building Type',
      bedroomCount: 'Bedrooms',
      bathroomCount: 'Bathrooms',
      kitchenCount: 'Kitchen',
      serviceRoomCount: 'Service Rooms',
      otherRoomsCount: 'Other Rooms',
      totalRooms: 'Total Rooms',
      floorLevel: 'Floor',
      floor: 'Floor',
      buildingGrade: 'Building Grade',
      siteGrade: 'Location Grade',
      blockNo: 'Block',
      parcelNo: 'Parcel',
      areaSqm: 'Square Footage',
      rentAmount: 'Rent',
      rent: 'Rent',
      yearBuilt: 'Year Built',
      yearRenovated: 'Year Renovated',
      tenureType: 'Tenure',
      workStatus: 'Status',
      status: 'Status',
      xCoordinate: 'Longitude',
      yCoordinate: 'Latitude',
      houseLocation: 'Address',
      mobilePhone: 'Phone',
      phone: 'Phone',
      remarks: 'Notes'
    } as ColumnMapping
  }
};
