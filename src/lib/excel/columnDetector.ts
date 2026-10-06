import { ColumnMapping } from '@/src/types/tenant';

// Alias patterns for intelligent column detection (English and Amharic)
const TENANT_CODE_ALIASES = [
  'identifier code',
  'identifier_code',
  'identifier',
  'መለያ',
  'ተ.ቁ',
  'ተ ቁ',
  'id',
  'tenant code',
  'tenant_code',
  'tenantcode',
  'tenant id',
  'tenant_id',
  'tenant no',
  'code'
];

const TENANT_NAME_ALIASES = [
  'tenant name',
  'tenant_name',
  'የተከራይ ስም',
  'ተከራይ',
  'tenant',
  'name',
  'company name',
  'resident name',
  'የነዋሪ ስም'
];

const RESIDENT_NAME_ALIASES = [
  'resident name',
  'resident_name',
  'የነዋሪ ስም',
  'name of resident',
  'resident',
  'ነዋሪ'
];

const UNIT_ALIASES = [
  'house number',
  'house_number',
  'house no',
  'house_no',
  'ቤት ቁጥር',
  'unit',
  'room',
  'suite'
];

const COMPLEX_NO_ALIASES = [
  'complex no',
  'complex_no',
  'complex number',
  'የኮምፕሌክስ ወ./ቁጥር',
  'የኮምፕሌክስ ቁጥር',
  'complex'
];

const TITLE_ALIASES = [
  'title',
  'ማዕረግ',
  'salutation'
];

const GENDER_ALIASES = [
  'gender',
  'ጾታ',
  'sex'
];

const SUB_CITY_ALIASES = [
  'sub city',
  'sub_city',
  'subcity',
  'ክ/ከተማ',
  'ክፍለ ከተማ',
  'branch',
  'city zone'
];

const WOREDA_ALIASES = [
  'woreda',
  'ወረዳ'
];

const KEBELE_ALIASES = [
  'kebele',
  'ቀበሌ'
];

const CITY_ALIASES = [
  'city',
  'ከተማ'
];

const HISTORICAL_USE_ALIASES = [
  'historical use',
  'historical_use',
  'የቤት ታሪካዊ አገልግሎት',
  'use',
  'category',
  'purpose'
];

const MAIN_HOUSE_ALIASES = [
  'main house',
  'main_house',
  'ዋና ቤት'
];

const BEDROOMS_ALIASES = [
  'bedroom count',
  'bedroom_count',
  'bedrooms',
  'የመኝታ ክፍል',
  'መኝታ'
];

const BATHROOMS_ALIASES = [
  'bathroom count',
  'bathroom_count',
  'bathrooms',
  'የመታጠቢያ ክፍል',
  'መታጠቢያ'
];

const KITCHEN_ALIASES = [
  'kitchen count',
  'kitchen_count',
  'kitchen',
  'የኪችን ክፍል',
  'ኩሽና'
];

const SERVICE_ROOMS_ALIASES = [
  'service room count',
  'service_room_count',
  'service rooms',
  'የሰርቪስ ቤት',
  'ሰርቪስ'
];

const OTHER_ROOMS_ALIASES = [
  'other rooms count',
  'other_rooms_count',
  'other rooms',
  'ሌላ ክፍል'
];

const TOTAL_ROOMS_ALIASES = [
  'total rooms',
  'total_rooms',
  'ጠቅላላ የክፍል ብዛት',
  'ክፍል ብዛት'
];

const FLOOR_ALIASES = [
  'floor level',
  'floor_level',
  'floor',
  'የወለል ደረጃ',
  'ደረጃ',
  'story'
];

const BUILDING_GRADE_ALIASES = [
  'building grade',
  'building_grade',
  'የቤቱ ደረጃ',
  'building standard'
];

const SITE_GRADE_ALIASES = [
  'site grade',
  'site_grade',
  'የቦታ ደረጃ',
  'location grade'
];

const BLOCK_NO_ALIASES = [
  'block no',
  'block_no',
  'ብሎክ ቁጥር',
  'ብሎክ'
];

const PARCEL_NO_ALIASES = [
  'parcel no',
  'parcel_no',
  'ፓርሰል ቁጥር',
  'ፓርሰል'
];

const AREA_SQM_ALIASES = [
  'area sqm',
  'area_sqm',
  'ስፋት',
  'area in m2',
  'area in m²',
  'area'
];

const RENT_ALIASES = [
  'rent amount',
  'rent_amount',
  'የኪራይ መጠን',
  'rent',
  'monthly rent',
  'ኪራይ'
];

const YEAR_BUILT_ALIASES = [
  'year built',
  'year_built',
  'የተገነባበት ዓ.ም',
  'built year'
];

const YEAR_RENOVATED_ALIASES = [
  'year renovated',
  'year_renovated',
  'የታደሰበት ዓ.ም'
];

const TENURE_TYPE_ALIASES = [
  'tenure type',
  'tenure_type',
  'የይዞታ ዓይነት/ሁኔታ',
  'tenure'
];

const WORK_STATUS_ALIASES = [
  'work status',
  'work_status',
  'የስራ ዓይነት/ሁኔታ',
  'status',
  'state'
];

const X_COORD_ALIASES = [
  'x coordinate',
  'x_coordinate',
  'x',
  'longitude'
];

const Y_COORD_ALIASES = [
  'y coordinate',
  'y_coordinate',
  'y',
  'latitude'
];

const HOUSE_LOCATION_ALIASES = [
  'house location',
  'house_location',
  'የቤቱ መገኛ',
  'location'
];

const PHONE_ALIASES = [
  'mobile phone',
  'mobile_phone',
  'mobile',
  'phone',
  'ስልክ',
  'telephone'
];

const REMARKS_ALIASES = [
  'remarks',
  'remark',
  'ማስታወሻ',
  'notes',
  'comment'
];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[-_.\s/]+/g, ' ');
}

function findBestMatch(headers: string[], aliases: string[]): string | undefined {
  // Pass 1: Exact match with normalized alias
  for (const header of headers) {
    const norm = normalizeHeader(header);
    if (aliases.includes(norm)) {
      return header;
    }
  }

  // Pass 2: Header contains alias or alias contains header
  for (const header of headers) {
    const norm = normalizeHeader(header);
    for (const alias of aliases) {
      if (norm === alias || norm.includes(alias) || alias.includes(norm)) {
        return header;
      }
    }
  }

  return undefined;
}

export function detectColumnMapping(headers: string[]): {
  mapping: ColumnMapping;
  isTenantCodeDetected: boolean;
} {
  const codeCol = findBestMatch(headers, TENANT_CODE_ALIASES);
  const nameCol = findBestMatch(headers, TENANT_NAME_ALIASES);
  const residentCol = findBestMatch(headers, RESIDENT_NAME_ALIASES);
  const unitCol = findBestMatch(headers, UNIT_ALIASES);
  const complexCol = findBestMatch(headers, COMPLEX_NO_ALIASES);
  const titleCol = findBestMatch(headers, TITLE_ALIASES);
  const genderCol = findBestMatch(headers, GENDER_ALIASES);
  const cityCol = findBestMatch(headers, CITY_ALIASES);
  const subCityCol = findBestMatch(headers, SUB_CITY_ALIASES);
  const woredaCol = findBestMatch(headers, WOREDA_ALIASES);
  const kebeleCol = findBestMatch(headers, KEBELE_ALIASES);
  const histUseCol = findBestMatch(headers, HISTORICAL_USE_ALIASES);
  const mainHouseCol = findBestMatch(headers, MAIN_HOUSE_ALIASES);
  const bedroomsCol = findBestMatch(headers, BEDROOMS_ALIASES);
  const bathroomsCol = findBestMatch(headers, BATHROOMS_ALIASES);
  const kitchenCol = findBestMatch(headers, KITCHEN_ALIASES);
  const serviceRoomsCol = findBestMatch(headers, SERVICE_ROOMS_ALIASES);
  const otherRoomsCol = findBestMatch(headers, OTHER_ROOMS_ALIASES);
  const totalRoomsCol = findBestMatch(headers, TOTAL_ROOMS_ALIASES);
  const floorCol = findBestMatch(headers, FLOOR_ALIASES);
  const buildingGradeCol = findBestMatch(headers, BUILDING_GRADE_ALIASES);
  const siteGradeCol = findBestMatch(headers, SITE_GRADE_ALIASES);
  const blockNoCol = findBestMatch(headers, BLOCK_NO_ALIASES);
  const parcelNoCol = findBestMatch(headers, PARCEL_NO_ALIASES);
  const areaSqmCol = findBestMatch(headers, AREA_SQM_ALIASES);
  const rentCol = findBestMatch(headers, RENT_ALIASES);
  const yearBuiltCol = findBestMatch(headers, YEAR_BUILT_ALIASES);
  const yearRenovatedCol = findBestMatch(headers, YEAR_RENOVATED_ALIASES);
  const tenureCol = findBestMatch(headers, TENURE_TYPE_ALIASES);
  const statusCol = findBestMatch(headers, WORK_STATUS_ALIASES);
  const xCol = findBestMatch(headers, X_COORD_ALIASES);
  const yCol = findBestMatch(headers, Y_COORD_ALIASES);
  const locationCol = findBestMatch(headers, HOUSE_LOCATION_ALIASES);
  const phoneCol = findBestMatch(headers, PHONE_ALIASES);
  const remarksCol = findBestMatch(headers, REMARKS_ALIASES);

  return {
    mapping: {
      tenantCode: codeCol || '',
      tenantName: nameCol,
      unit: unitCol,
      phone: phoneCol,
      status: statusCol,
      branch: subCityCol,
      floor: floorCol,
      rent: rentCol,
      category: histUseCol,

      // Property Registry fields
      city: cityCol,
      subCity: subCityCol,
      woreda: woredaCol,
      kebele: kebeleCol,
      houseNumber: unitCol,
      complexNo: complexCol,
      title: titleCol,
      residentName: residentCol,
      gender: genderCol,
      historicalUse: histUseCol,
      mainHouse: mainHouseCol,
      bedroomCount: bedroomsCol,
      bathroomCount: bathroomsCol,
      kitchenCount: kitchenCol,
      serviceRoomCount: serviceRoomsCol,
      otherRoomsCount: otherRoomsCol,
      totalRooms: totalRoomsCol,
      floorLevel: floorCol,
      buildingGrade: buildingGradeCol,
      siteGrade: siteGradeCol,
      blockNo: blockNoCol,
      parcelNo: parcelNoCol,
      areaSqm: areaSqmCol,
      rentAmount: rentCol,
      yearBuilt: yearBuiltCol,
      yearRenovated: yearRenovatedCol,
      tenureType: tenureCol,
      workStatus: statusCol,
      xCoordinate: xCol,
      yCoordinate: yCol,
      houseLocation: locationCol,
      mobilePhone: phoneCol,
      remarks: remarksCol
    },
    isTenantCodeDetected: Boolean(codeCol)
  };
}
