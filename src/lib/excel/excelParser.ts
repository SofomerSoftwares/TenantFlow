import * as XLSX from 'xlsx';
import { ParsedExcelFile, TenantRecord } from '@/src/types/tenant';
import { detectColumnMapping } from './columnDetector';

export async function parseExcelFile(file: File): Promise<ParsedExcelFile> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded spreadsheet contains no sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse rows as raw JSON array of objects
  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd'
  });

  if (rawData.length === 0) {
    throw new Error('The spreadsheet sheet appears to be empty or has no data rows.');
  }

  // Extract all distinct headers from keys
  const headerSet = new Set<string>();
  rawData.forEach(row => {
    Object.keys(row).forEach(key => headerSet.add(key.trim()));
  });
  const headers = Array.from(headerSet);

  const { mapping, isTenantCodeDetected } = detectColumnMapping(headers);

  return {
    fileName: file.name,
    fileSize: file.size,
    fileSizeBytes: file.size,
    headers,
    rows: rawData,
    totalRows: rawData.length,
    detectedMapping: mapping,
    isTenantCodeDetected
  };
}

export function convertRowsToTenantRecords(
  rows: Record<string, any>[],
  mapping: { tenantCode: string; tenantName?: string; unit?: string; [k: string]: any }
): TenantRecord[] {
  return rows.map((row) => {
    const getVal = (key?: string) => (key && row[key] !== undefined ? row[key] : undefined);

    const rawCode = String(getVal(mapping.tenantCode) ?? row['identifier_code'] ?? row['መለያ'] ?? row['tenant_code'] ?? row['Tenant Code'] ?? '').trim();
    const rawName = String(getVal(mapping.tenantName) ?? row['tenant_name'] ?? row['የተከራይ ስም'] ?? row['Tenant Name'] ?? row['TENANT'] ?? '').trim();
    const rawResident = String(getVal(mapping.residentName) ?? row['resident_name'] ?? row['የነዋሪ ስም'] ?? row['NAME OF RESIDENT'] ?? '').trim();
    const rawCity = String(getVal(mapping.city) ?? row['city'] ?? row['ከተማ'] ?? 'Addis Ababa').trim();
    const rawSubCity = String(getVal(mapping.subCity) ?? getVal(mapping.branch) ?? row['sub_city'] ?? row['ክ/ከተማ'] ?? row['Branch'] ?? '').trim();
    const rawWoreda = String(getVal(mapping.woreda) ?? row['woreda'] ?? row['ወረዳ'] ?? '').trim();
    const rawKebele = String(getVal(mapping.kebele) ?? row['kebele'] ?? row['ቀበሌ'] ?? '').trim();
    const rawHouseNum = String(getVal(mapping.houseNumber) ?? getVal(mapping.unit) ?? row['house_number'] ?? row['ቤት ቁጥር'] ?? row['House No.'] ?? row['Unit'] ?? '').trim();
    const rawComplex = String(getVal(mapping.complexNo) ?? row['complex_no'] ?? row['የኮምፕሌክስ ወ./ቁጥር'] ?? '').trim();
    const rawTitle = String(getVal(mapping.title) ?? row['title'] ?? row['ማዕረግ'] ?? '').trim();
    const rawGender = String(getVal(mapping.gender) ?? row['gender'] ?? row['ጾታ'] ?? '').trim();
    const rawHistoricalUse = String(getVal(mapping.historicalUse) ?? getVal(mapping.category) ?? row['historical_use'] ?? row['የቤት ታሪካዊ አገልግሎት'] ?? row['Category'] ?? '').trim();
    const rawMainHouse = String(getVal(mapping.mainHouse) ?? row['main_house'] ?? row['ዋና ቤት'] ?? 'Main').trim();

    const rawBedrooms = Number(getVal(mapping.bedroomCount) ?? row['bedroom_count'] ?? row['የመኝታ ክፍል'] ?? 0);
    const rawBathrooms = Number(getVal(mapping.bathroomCount) ?? row['bathroom_count'] ?? row['የመታጠቢያ ክፍል'] ?? 0);
    const rawKitchen = Number(getVal(mapping.kitchenCount) ?? row['kitchen_count'] ?? row['የኪችን ክፍል'] ?? 0);
    const serviceRooms = Number(getVal(mapping.serviceRoomCount) ?? row['service_room_count'] ?? row['የሰርቪስ ቤት'] ?? 0);
    const otherRooms = Number(getVal(mapping.otherRoomsCount) ?? row['other_rooms_count'] ?? row['ሌላ ክፍል'] ?? 0);
    const rawTotalRooms = Number(getVal(mapping.totalRooms) ?? row['total_rooms'] ?? row['ጠቅላላ የክፍል ብዛት'] ?? 0) ||
      (rawBedrooms + rawBathrooms + rawKitchen + serviceRooms + otherRooms);

    const rawFloor = String(getVal(mapping.floorLevel) ?? getVal(mapping.floor) ?? row['floor_level'] ?? row['የወለል ደረጃ'] ?? row['Floor'] ?? '').trim();
    const rawBuildingGrade = String(getVal(mapping.buildingGrade) ?? row['building_grade'] ?? row['የቤቱ ደረጃ'] ?? '').trim();
    const rawSiteGrade = String(getVal(mapping.siteGrade) ?? row['site_grade'] ?? row['የቦታ ደረጃ'] ?? '').trim();
    const rawBlockNo = String(getVal(mapping.blockNo) ?? row['block_no'] ?? row['ብሎክ ቁጥር'] ?? '').trim();
    const rawParcelNo = String(getVal(mapping.parcelNo) ?? row['parcel_no'] ?? row['ፓርሰል ቁጥር'] ?? '').trim();

    const areaVal = getVal(mapping.areaSqm) ?? row['area_sqm'] ?? row['ስፋት'] ?? row['Square Footage'];
    const rawArea = areaVal !== undefined && areaVal !== '' ? Number(areaVal) : undefined;

    const rentVal = getVal(mapping.rentAmount) ?? getVal(mapping.rent) ?? row['rent_amount'] ?? row['የኪራይ መጠን'] ?? row['Rent'];
    const rawRent = rentVal !== undefined && rentVal !== '' ? Number(rentVal) : undefined;

    const yearBuiltVal = getVal(mapping.yearBuilt) ?? row['year_built'] ?? row['የተገነባበት ዓ.ም'];
    const rawYearBuilt = yearBuiltVal !== undefined && yearBuiltVal !== '' ? Number(yearBuiltVal) : undefined;

    const yearRenovatedVal = getVal(mapping.yearRenovated) ?? row['year_renovated'] ?? row['የታደሰበት ዓ.ም'];
    const rawYearRenovated = yearRenovatedVal !== undefined && yearRenovatedVal !== '' ? Number(yearRenovatedVal) : undefined;

    const rawTenure = String(getVal(mapping.tenureType) ?? row['tenure_type'] ?? row['የይዞታ ዓይነት/ሁኔታ'] ?? '').trim();
    const rawWorkStatus = String(getVal(mapping.workStatus) ?? getVal(mapping.status) ?? row['work_status'] ?? row['የስራ ዓይነት/ሁኔታ'] ?? row['Status'] ?? 'Active').trim();

    const xVal = getVal(mapping.xCoordinate) ?? row['x_coordinate'] ?? row['X COORDINATE'];
    const rawX = xVal !== undefined && xVal !== '' ? Number(xVal) : undefined;

    const yVal = getVal(mapping.yCoordinate) ?? row['y_coordinate'] ?? row['Y COORDINATE'];
    const rawY = yVal !== undefined && yVal !== '' ? Number(yVal) : undefined;

    const rawLocation = String(getVal(mapping.houseLocation) ?? row['house_location'] ?? row['የቤቱ መገኛ'] ?? '').trim();
    const rawPhone = String(getVal(mapping.mobilePhone) ?? getVal(mapping.phone) ?? row['mobile_phone'] ?? row['Mobile'] ?? row['ስልክ'] ?? row['Phone'] ?? '').trim();
    const rawEmail = String(getVal(mapping.email) ?? row['email'] ?? row['Email'] ?? '').trim();
    const rawRemarks = String(getVal(mapping.remarks) ?? row['remarks'] ?? row['Remark'] ?? row['ማስታወሻ'] ?? '').trim();

    return {
      // Primary Property Registry fields
      identifier_code: rawCode,
      city: rawCity || undefined,
      sub_city: rawSubCity || undefined,
      woreda: rawWoreda || undefined,
      kebele: rawKebele || undefined,
      house_number: rawHouseNum || undefined,
      complex_no: rawComplex || undefined,
      title: rawTitle || undefined,
      tenant_name: rawName || 'Unnamed Occupant',
      resident_name: rawResident || undefined,
      gender: rawGender || undefined,
      historical_use: rawHistoricalUse || undefined,
      main_house: rawMainHouse || undefined,
      bedroom_count: rawBedrooms,
      bathroom_count: rawBathrooms,
      kitchen_count: rawKitchen,
      service_room_count: serviceRooms,
      other_rooms_count: otherRooms,
      total_rooms: rawTotalRooms,
      floor_level: rawFloor || undefined,
      building_grade: rawBuildingGrade || undefined,
      site_grade: rawSiteGrade || undefined,
      block_no: rawBlockNo || undefined,
      parcel_no: rawParcelNo || undefined,
      area_sqm: rawArea,
      rent_amount: rawRent,
      year_built: rawYearBuilt,
      year_renovated: rawYearRenovated,
      tenure_type: rawTenure || undefined,
      work_status: rawWorkStatus || undefined,
      x_coordinate: rawX,
      y_coordinate: rawY,
      house_location: rawLocation || undefined,
      mobile_phone: rawPhone || undefined,
      remarks: rawRemarks || undefined,

      // Compatibility fields
      tenantCode: rawCode,
      tenantName: rawName || 'Unnamed Occupant',
      unit: rawHouseNum || 'N/A',
      branch: rawSubCity || undefined,
      floor: rawFloor || undefined,
      phone: rawPhone || undefined,
      email: rawEmail || undefined,
      status: normalizeStatus(rawWorkStatus),
      rent: rawRent,
      category: rawHistoricalUse || undefined,
      rawFields: { ...row }
    };
  });
}

function normalizeStatus(statusStr: string): string {
  if (!statusStr) return 'Active';
  const s = statusStr.trim().toLowerCase();
  if (['active', 'act', 'occupied', 'current', 'valid', 'active commercial', 'active residential'].includes(s)) return 'Active';
  if (['inactive', 'vacant', 'terminated', 'closed', 'expired'].includes(s)) return 'Inactive';
  if (['pending', 'onboarding', 'draft', 'pending renewal'].includes(s)) return 'Pending';
  return statusStr.trim();
}
