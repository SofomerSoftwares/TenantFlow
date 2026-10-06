import * as XLSX from 'xlsx';
import { TenantRecord } from '@/src/types/tenant';

const SUB_CITIES = ['Bole', 'Kirkos', 'Yeka', 'Arada', 'Lideta', 'Nifas Silk', 'Gullele', 'Akaky Kaliti', 'Kolfe Keranio', 'Lemi Kura'];
const HISTORICAL_USES = [
  'Commercial / Office',
  'Retail / Shop',
  'Residential Dwelling',
  'Medical Clinic / Pharmacy',
  'Cafeteria / Restaurant',
  'Service Workshop',
  'Cultural / Art Center'
];

const ETHIOPIAN_NAMES = [
  'Abebe Kebede', 'Tigist Haile', 'Dawit Wolde', 'Selamawit Tadesse', 'Yohannes Bekele',
  'Mulugeta Assefa', 'Almaz Belay', 'Biruk Solomon', 'Hirut Desta', 'Kassahun Tesfaye',
  'Rahel Mengistu', 'Daniel Tilahun', 'Bethelhem Zewde', 'Ephrem Girma', 'Frehiwot Alemayehu',
  'Girma Tekle', 'Hiwot Negash', 'Kalkidan Fikru', 'Mesfin Worku', 'Netsanet Araya',
  'Samuel Berhanu', 'Tsion Getachew', 'Yared Mekonnen', 'Zelalem Ayalew', 'Aster Molla',
  'Blen Kassa', 'Desta Hailu', 'Eskinder Nega', 'Genet Demisse', 'Habtamu Tefera',
  'Konjit Shibabaw', 'Lemlem Gashaw', 'Million Asrat', 'Nigist Abebe', 'Robel Kidane',
  'Senait Legesse', 'Tadesse Gebre', 'Wondwossen Tadesse', 'Yeshiwork Lemma', 'Zenebech Biftu'
];

const TITLES = ['Ato', 'W/ro', 'Dr.', 'Eng.', 'Ato', 'W/ro'];
const BUILDING_GRADES = ['Grade A', 'Grade B+', 'Grade B', 'Grade C', 'Heritage Class'];
const SITE_GRADES = ['Prime Area', 'Commercial Corridor', 'Secondary', 'Residential Zone'];
const TENURE_TYPES = ['Kebele Housing', 'Rented State Property', 'Municipal Lease', 'Private Tenancy'];
const WORK_STATUSES = ['Active Commercial', 'Active Residential', 'Active Healthcare', 'Active Legal', 'Active Retail'];

export function generate100MasterTenants(): TenantRecord[] {
  const tenants: TenantRecord[] = [];

  for (let i = 1; i <= 100; i++) {
    const codeNum = String(i).padStart(3, '0');
    const subCity = SUB_CITIES[i % SUB_CITIES.length];
    const subCode = subCity.slice(0, 3).toUpperCase();
    const identifier_code = `ETH-AA-${subCode}-${codeNum}`;
    const nameIndex = (i - 1) % ETHIOPIAN_NAMES.length;
    const baseName = ETHIOPIAN_NAMES[nameIndex];
    const tenant_name = i > ETHIOPIAN_NAMES.length ? `${baseName} (Branch ${Math.floor(i / ETHIOPIAN_NAMES.length) + 1})` : baseName;
    const resident_name = tenant_name;

    const woredaNum = String((i % 12) + 1).padStart(2, '0');
    const kebeleNum = String((i % 15) + 1).padStart(2, '0');
    const woreda = `Woreda ${woredaNum}`;
    const kebele = `Kebele ${kebeleNum}`;
    const house_number = `HN-${100 + i}`;
    const complex_no = `CMP-${String(Math.floor(i / 10) + 1).padStart(2, '0')}`;
    const title = TITLES[i % TITLES.length];
    const gender = i % 2 === 0 ? 'F' : 'M';
    const historical_use = HISTORICAL_USES[i % HISTORICAL_USES.length];
    const main_house = 'Main House';

    const bedroom_count = (i % 4) + 1;
    const bathroom_count = (i % 3) + 1;
    const kitchen_count = 1;
    const service_room_count = i % 3;
    const other_rooms_count = i % 2;
    const total_rooms = bedroom_count + bathroom_count + kitchen_count + service_room_count + other_rooms_count;

    const floor_level = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor'][i % 5];
    const building_grade = BUILDING_GRADES[i % BUILDING_GRADES.length];
    const site_grade = SITE_GRADES[i % SITE_GRADES.length];
    const block_no = `B-${String((i % 20) + 1).padStart(2, '0')}`;
    const parcel_no = `P-${200 + i}`;
    const area_sqm = 65 + ((i * 11) % 200);
    const rent_amount = 12000 + (i * 750);
    const year_built = 1985 + (i % 38);
    const year_renovated = i % 3 === 0 ? 2018 + (i % 7) : undefined;
    const tenure_type = TENURE_TYPES[i % TENURE_TYPES.length];
    const isInactive = i % 20 === 0;
    const work_status = isInactive ? 'Inactive' : WORK_STATUSES[i % WORK_STATUSES.length];

    const x_coordinate = Number((38.740000 + ((i * 179) % 10000) / 100000).toFixed(6));
    const y_coordinate = Number((8.970000 + ((i * 233) % 10000) / 100000).toFixed(6));
    const house_location = `${subCity} Zone, near ${woreda} Administrative Office`;
    const mobile_phone = `+2519${String(1000000 + (i * 91823)).slice(0, 8)}`;
    const remarks = `Verified registry entry - Block ${block_no}, Parcel ${parcel_no}`;

    tenants.push({
      identifier_code,
      city: 'Addis Ababa',
      sub_city: subCity,
      woreda,
      kebele,
      house_number,
      complex_no,
      title,
      tenant_name,
      resident_name,
      gender,
      historical_use,
      main_house,
      bedroom_count,
      bathroom_count,
      kitchen_count,
      service_room_count,
      other_rooms_count,
      total_rooms,
      floor_level,
      building_grade,
      site_grade,
      block_no,
      parcel_no,
      area_sqm,
      rent_amount,
      year_built,
      year_renovated,
      tenure_type,
      work_status,
      x_coordinate,
      y_coordinate,
      house_location,
      mobile_phone,
      remarks,

      // Compatibility fields
      tenantCode: identifier_code,
      tenantName: tenant_name,
      unit: house_number,
      branch: subCity,
      floor: floor_level,
      phone: mobile_phone,
      email: `${tenant_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@registry.gov.et`,
      status: isInactive ? 'Inactive' : 'Active',
      rent: rent_amount,
      category: historical_use,
      rawFields: {
        'Sub-City': subCity,
        'Woreda': woreda,
        'Kebele': kebele,
        'House Number': house_number,
        'Area (m²)': area_sqm,
        'Rent (ETB)': rent_amount,
        'Building Grade': building_grade,
        'Tenure Type': tenure_type
      },
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-03-25T11:20:00Z'
    });
  }

  return tenants;
}

export function generateNewSystemTenants(masterTenants: TenantRecord[]): Record<string, any>[] {
  const rows: Record<string, any>[] = [];

  // 1. Existing tenants with updates (first 85 tenants)
  const presentInNew = masterTenants.slice(0, 85);

  presentInNew.forEach((t, idx) => {
    const row: Record<string, any> = {
      'identifier_code': t.identifier_code,
      'city': t.city,
      'sub_city': t.sub_city,
      'woreda': t.woreda,
      'kebele': t.kebele,
      'house_number': t.house_number,
      'complex_no': t.complex_no,
      'title': t.title,
      'tenant_name': t.tenant_name,
      'resident_name': t.resident_name,
      'gender': t.gender,
      'historical_use': t.historical_use,
      'main_house': t.main_house,
      'bedroom_count': t.bedroom_count,
      'bathroom_count': t.bathroom_count,
      'kitchen_count': t.kitchen_count,
      'service_room_count': t.service_room_count,
      'other_rooms_count': t.other_rooms_count,
      'total_rooms': t.total_rooms,
      'floor_level': t.floor_level,
      'building_grade': t.building_grade,
      'site_grade': t.site_grade,
      'block_no': t.block_no,
      'parcel_no': t.parcel_no,
      'area_sqm': t.area_sqm,
      'rent_amount': t.rent_amount,
      'year_built': t.year_built,
      'year_renovated': t.year_renovated,
      'tenure_type': t.tenure_type,
      'work_status': t.work_status,
      'x_coordinate': t.x_coordinate,
      'y_coordinate': t.y_coordinate,
      'house_location': t.house_location,
      'mobile_phone': t.mobile_phone,
      'remarks': t.remarks
    };

    // Realistic modifications
    if (idx === 0) {
      row['rent_amount'] = Number(t.rent_amount) + 5000;
      row['remarks'] = 'Annual inflation rate adjustment applied';
    } else if (idx === 3) {
      row['tenant_name'] = `${t.tenant_name} & Associates`;
      row['historical_use'] = 'Commercial / Corporate HQ';
    } else if (idx === 7) {
      row['work_status'] = 'Inactive';
      row['remarks'] = 'Property undergoing municipal renovation';
    } else if (idx === 12) {
      row['mobile_phone'] = '+251911889900';
    } else if (idx === 18) {
      row['area_sqm'] = Number(t.area_sqm) + 25.5;
      row['total_rooms'] = Number(t.total_rooms) + 1;
      row['bedroom_count'] = Number(t.bedroom_count) + 1;
    }

    rows.push(row);
  });

  // 2. Add 8 NEW property registry records
  for (let n = 101; n <= 108; n++) {
    rows.push({
      'identifier_code': `ETH-AA-BOL-${n}`,
      'city': 'Addis Ababa',
      'sub_city': 'Bole',
      'woreda': 'Woreda 03',
      'kebele': 'Kebele 08',
      'house_number': `HN-${200 + n}`,
      'complex_no': 'CMP-09',
      'title': 'Ato',
      'tenant_name': `New Property Tenant #${n - 100}`,
      'resident_name': `New Property Tenant #${n - 100}`,
      'gender': n % 2 === 0 ? 'F' : 'M',
      'historical_use': 'Commercial Office',
      'main_house': 'Main House',
      'bedroom_count': 3,
      'bathroom_count': 2,
      'kitchen_count': 1,
      'service_room_count': 1,
      'other_rooms_count': 0,
      'total_rooms': 7,
      'floor_level': '1st Floor',
      'building_grade': 'Grade A',
      'site_grade': 'Prime Area',
      'block_no': 'B-21',
      'parcel_no': `P-${300 + n}`,
      'area_sqm': 140.00,
      'rent_amount': 38000.00,
      'year_built': 2023,
      'year_renovated': undefined,
      'tenure_type': 'Municipal Lease',
      'work_status': 'Active Commercial',
      'x_coordinate': 38.789123,
      'y_coordinate': 8.998124,
      'house_location': 'Bole Medhanialem Commercial Center',
      'mobile_phone': `+251977${n}00`,
      'remarks': 'Newly constructed property registered Q3 2026'
    });
  }

  // 3. Add 1 DUPLICATE for heuristic test
  rows.push({
    'identifier_code': 'ETH-AA-BOL-002',
    'city': 'Addis Ababa',
    'sub_city': 'Bole',
    'house_number': 'HN-102',
    'tenant_name': 'Duplicate Row Record',
    'rent_amount': 25000,
    'work_status': 'Active Commercial'
  });

  return rows;
}

export function downloadDemoMasterExcel() {
  const masterTenants = generate100MasterTenants();
  const rows = masterTenants.map((t) => ({
    'መለያ (Identifier)': t.identifier_code,
    'ከተማ (City)': t.city,
    'ክ/ከተማ (Sub-City)': t.sub_city,
    'ወረዳ (Woreda)': t.woreda,
    'ቀበሌ (Kebele)': t.kebele,
    'ቤት ቁጥር (House No.)': t.house_number,
    'የኮምፕሌክስ ወ./ቁጥር (Complex No.)': t.complex_no,
    'ማዕረግ (Title)': t.title,
    'የተከራይ ስም (Tenant Name)': t.tenant_name,
    'የነዋሪ ስም (Resident Name)': t.resident_name,
    'ጾታ (Gender)': t.gender,
    'የቤት ታሪካዊ አገልግሎት (Historical Use)': t.historical_use,
    'ዋና ቤት (Main House)': t.main_house,
    'የመኝታ ክፍል (Bedrooms)': t.bedroom_count,
    'የመታጠቢያ ክፍል (Bathrooms)': t.bathroom_count,
    'የኪችን ክፍል (Kitchen)': t.kitchen_count,
    'የሰርቪስ ቤት (Service Rooms)': t.service_room_count,
    'ሌላ ክፍል (Other Rooms)': t.other_rooms_count,
    'ጠቅላላ የክፍል ብዛት (Total Rooms)': t.total_rooms,
    'የወለል ደረጃ (Floor Level)': t.floor_level,
    'የቤቱ ደረጃ (Building Grade)': t.building_grade,
    'የቦታ ደረጃ (Site Grade)': t.site_grade,
    'ብሎክ ቁጥር (Block No.)': t.block_no,
    'ፓርሰል ቁጥር (Parcel No.)': t.parcel_no,
    'ስፋት (Area m²)': t.area_sqm,
    'የኪራይ መጠን (Rent Amount)': t.rent_amount,
    'የተገነባበት ዓ.ም (Year Built)': t.year_built,
    'የታደሰበት ዓ.ም (Year Renovated)': t.year_renovated,
    'የይዞታ ዓይነት/ሁኔታ (Tenure Type)': t.tenure_type,
    'የስራ ዓይነት/ሁኔታ (Work Status)': t.work_status,
    'X COORDINATE': t.x_coordinate,
    'Y COORDINATE': t.y_coordinate,
    'የቤቱ መገኛ (Location)': t.house_location,
    'ስልክ (Mobile Phone)': t.mobile_phone,
    'ማስታወሻ (Remarks)': t.remarks
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Property Registry Master');
  XLSX.writeFile(wb, 'property_registry_master.xlsx');
}

export function downloadDemoNewSystemExcel() {
  const masterTenants = generate100MasterTenants();
  const rows = generateNewSystemTenants(masterTenants);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Property System Update');
  XLSX.writeFile(wb, 'property_system_update.xlsx');
}
