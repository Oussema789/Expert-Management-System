import {
  AtlasDatabaseState,
  DocumentAttachmentMeta,
  DocumentCategory,
  Expert,
  Partner,
  Subcontractor,
} from '../types/database';

export const DEFAULT_DOMAINS: string[] = [
  'Génie Civil & Infrastructures',
  'Énergie & Transition Climatique',
  'Hydraulique & Assainissement',
  'Gouvernance & Secteur Public',
  'Systèmes d’Information & Data',
  'Environnement & EIES',
  'Finance Publique & Audit',
  'Transport & Mobilité',
  'Agriculture & Développement Rural',
  'Aménagement Urbain',
];

export const DEFAULT_COUNTRIES: string[] = [
  'France',
  'Tunisie',
  'Maroc',
  'Sénégal',
  'Côte d’Ivoire',
  'Belgique',
  'Suisse',
  'Allemagne',
  'Canada',
  'Algérie',
  'Cameroun',
  'Égypte',
  'Espagne',
];

export const INITIAL_EXPERTS: Expert[] = [
  {
    id: 'exp-1',
    code: 'EXP-001',
    lastName: 'Ben Salah',
    firstName: 'Karim',
    scope: 'International',
    nationality: 'Tunisienne',
    country: 'Tunisie',
    domains: ['Hydraulique & Assainissement', 'Génie Civil & Infrastructures'],
    yearsExperience: 16,
    reference: 'REF-BAD-2023-HYD',
    email: 'k.bensalah@hydrosys-conseil.tn',
    website: 'https://hydrosys-conseil.tn',
    attachments: [
      {
        id: 'att-exp1-dip',
        category: 'diplome',
        fileName: 'Diplome_Ingenieur_Hydraulique_ENIT.pdf',
        fileSize: 2840,
        mimeType: 'application/pdf',
        uploadedAt: '2025-11-10T09:15:00.000Z',
      },
      {
        id: 'att-exp1-cv',
        category: 'cv',
        fileName: 'CV_Karim_Ben_Salah_2025.pdf',
        fileSize: 3120,
        mimeType: 'application/pdf',
        uploadedAt: '2025-11-10T09:16:00.000Z',
      },
      {
        id: 'att-exp1-ref',
        category: 'reference',
        fileName: 'Attestation_Bonne_Execution_SONEDE.pdf',
        fileSize: 2490,
        mimeType: 'application/pdf',
        uploadedAt: '2025-11-10T09:17:00.000Z',
      },
      {
        id: 'att-exp1-cert',
        category: 'certificat',
        fileName: 'Certificat_Gestion_Ouvrages_FIDIC.pdf',
        fileSize: 2150,
        mimeType: 'application/pdf',
        uploadedAt: '2025-11-10T09:18:00.000Z',
      },
    ],
    projects: [
      {
        id: 'prj-101',
        title: 'Schéma Directeur AEP Grand Tunis',
        completionYear: 2023,
        country: 'Tunisie',
        domain: 'Hydraulique & Assainissement',
        partnerName: 'HydroConsult Méditerranée',
        referenceCode: 'REF-BAD-2023-HYD',
      },
      {
        id: 'prj-102',
        title: 'Réhabilitation Station Épuration Dakar Nord',
        completionYear: 2024,
        country: 'Sénégal',
        domain: 'Hydraulique & Assainissement',
        partnerName: 'AfriInfra Ingénierie',
        referenceCode: 'REF-AFD-2024-SN',
      },
    ],
    notes: 'Expert principal FIDIC, bilingue français/arabe/anglais.',
    updatedAt: '2025-11-10T09:20:00.000Z',
  },
  {
    id: 'exp-2',
    code: 'EXP-002',
    lastName: 'Moreau',
    firstName: 'Claire',
    scope: 'International',
    nationality: 'Française',
    country: 'France',
    domains: ['Énergie & Transition Climatique', 'Environnement & EIES'],
    yearsExperience: 12,
    reference: 'REF-UE-2024-CLIM',
    email: 'claire.moreau@climat-strategie.fr',
    website: 'https://climat-strategie.fr',
    attachments: [
      {
        id: 'att-exp2-dip',
        category: 'diplome',
        fileName: 'Master_Energie_Mines_ParisTech.pdf',
        fileSize: 2650,
        mimeType: 'application/pdf',
        uploadedAt: '2025-10-18T14:00:00.000Z',
      },
      {
        id: 'att-exp2-cv',
        category: 'cv',
        fileName: 'CV_Claire_Moreau_FR_EN.pdf',
        fileSize: 2980,
        mimeType: 'application/pdf',
        uploadedAt: '2025-10-18T14:05:00.000Z',
      },
      {
        id: 'att-exp2-cert',
        category: 'certificat',
        fileName: 'Certificat_Audit_Energetique_ISO50001.pdf',
        fileSize: 2340,
        mimeType: 'application/pdf',
        uploadedAt: '2025-10-18T14:07:00.000Z',
      },
    ],
    projects: [
      {
        id: 'prj-201',
        title: 'Plan de Décarbonation Portuaire Tanger Med',
        completionYear: 2024,
        country: 'Maroc',
        domain: 'Énergie & Transition Climatique',
        partnerName: 'EuroMed Énergie',
        referenceCode: 'REF-UE-2024-CLIM',
      },
    ],
    notes: 'Spécialiste bilans carbone et parcs photovoltaïques.',
    updatedAt: '2025-10-18T14:10:00.000Z',
  },
  {
    id: 'exp-3',
    code: 'EXP-003',
    lastName: 'Diallo',
    firstName: 'Moussa',
    scope: 'International',
    nationality: 'Sénégalaise',
    country: 'Sénégal',
    domains: ['Systèmes d’Information & Data', 'Gouvernance & Secteur Public'],
    yearsExperience: 10,
    reference: 'REF-BM-2022-GOV',
    email: 'm.diallo@sahel-digital.sn',
    website: 'https://sahel-digital.sn',
    attachments: [
      {
        id: 'att-exp3-dip',
        category: 'diplome',
        fileName: 'Diplome_Master_SI_Polytechnique_Thies.pdf',
        fileSize: 2510,
        mimeType: 'application/pdf',
        uploadedAt: '2025-09-22T11:30:00.000Z',
      },
      {
        id: 'att-exp3-cv',
        category: 'cv',
        fileName: 'CV_Moussa_Diallo_2025.pdf',
        fileSize: 2890,
        mimeType: 'application/pdf',
        uploadedAt: '2025-09-22T11:32:00.000Z',
      },
      {
        id: 'att-exp3-ref',
        category: 'reference',
        fileName: 'Reference_Ministere_Finances_SN.pdf',
        fileSize: 2210,
        mimeType: 'application/pdf',
        uploadedAt: '2025-09-22T11:34:00.000Z',
      },
    ],
    projects: [
      {
        id: 'prj-301',
        title: 'Digitalisation Registre Foncier National',
        completionYear: 2022,
        country: 'Sénégal',
        domain: 'Systèmes d’Information & Data',
        partnerName: 'AfriInfra Ingénierie',
        referenceCode: 'REF-BM-2022-GOV',
      },
      {
        id: 'prj-302',
        title: 'Portail Open Data Collectivités Territoriales',
        completionYear: 2025,
        country: 'Côte d’Ivoire',
        domain: 'Gouvernance & Secteur Public',
        partnerName: 'Cabinet CiviTech',
        referenceCode: 'REF-UEMOA-2025-CI',
      },
    ],
    updatedAt: '2025-09-22T11:40:00.000Z',
  },
  {
    id: 'exp-4',
    code: 'EXP-004',
    lastName: 'El Amrani',
    firstName: 'Nadia',
    scope: 'Nationale',
    nationality: 'Marocaine',
    country: 'Maroc',
    domains: ['Finance Publique & Audit', 'Gouvernance & Secteur Public'],
    yearsExperience: 9,
    reference: 'REF-NAT-2023-AUD',
    email: 'n.elamrani@atlas-audit.ma',
    website: 'https://atlas-audit.ma',
    attachments: [
      {
        id: 'att-exp4-dip',
        category: 'diplome',
        fileName: 'Diplome_Expertise_Comptable_ISCAE.pdf',
        fileSize: 2420,
        mimeType: 'application/pdf',
        uploadedAt: '2025-08-14T16:00:00.000Z',
      },
      {
        id: 'att-exp4-cv',
        category: 'cv',
        fileName: 'CV_Nadia_El_Amrani.pdf',
        fileSize: 2740,
        mimeType: 'application/pdf',
        uploadedAt: '2025-08-14T16:02:00.000Z',
      },
      {
        id: 'att-exp4-ref',
        category: 'reference',
        fileName: 'Attestation_Mission_Audit_Region_Rabat.pdf',
        fileSize: 2190,
        mimeType: 'application/pdf',
        uploadedAt: '2025-08-14T16:05:00.000Z',
      },
      {
        id: 'att-exp4-cert',
        category: 'certificat',
        fileName: 'Certificat_IPSAS_Comptabilite_Publique.pdf',
        fileSize: 2100,
        mimeType: 'application/pdf',
        uploadedAt: '2025-08-14T16:06:00.000Z',
      },
    ],
    projects: [
      {
        id: 'prj-401',
        title: 'Audit Financier Programme Routes Rurales',
        completionYear: 2023,
        country: 'Maroc',
        domain: 'Finance Publique & Audit',
        partnerName: 'EuroMed Énergie',
        referenceCode: 'REF-NAT-2023-AUD',
      },
    ],
    updatedAt: '2025-08-14T16:10:00.000Z',
  },
  {
    id: 'exp-5',
    code: 'EXP-005',
    lastName: 'Trabelsi',
    firstName: 'Youssef',
    scope: 'Nationale',
    nationality: 'Tunisienne',
    country: 'Tunisie',
    domains: ['Génie Civil & Infrastructures', 'Transport & Mobilité'],
    yearsExperience: 7,
    reference: 'REF-NAT-2024-INF',
    email: 'y.trabelsi@structura-tn.com',
    website: 'https://structura-tn.com',
    attachments: [
      {
        id: 'att-exp5-dip',
        category: 'diplome',
        fileName: 'Diplome_Genie_Civil_ENIS.pdf',
        fileSize: 2380,
        mimeType: 'application/pdf',
        uploadedAt: '2025-07-04T10:15:00.000Z',
      },
      {
        id: 'att-exp5-cv',
        category: 'cv',
        fileName: 'CV_Youssef_Trabelsi.pdf',
        fileSize: 2620,
        mimeType: 'application/pdf',
        uploadedAt: '2025-07-04T10:18:00.000Z',
      },
    ],
    projects: [
      {
        id: 'prj-501',
        title: 'Étude Avant-Projet Échangeur Sfax Sud',
        completionYear: 2024,
        country: 'Tunisie',
        domain: 'Transport & Mobilité',
        partnerName: 'HydroConsult Méditerranée',
        referenceCode: 'REF-NAT-2024-INF',
      },
    ],
    updatedAt: '2025-07-04T10:20:00.000Z',
  },
];

export const INITIAL_SUBCONTRACTORS: Subcontractor[] = [
  {
    id: 'sub-1',
    code: 'ST-001',
    name: 'GeoScan Topographie SARL',
    country: 'Tunisie',
    domains: ['Génie Civil & Infrastructures', 'Aménagement Urbain'],
    contactName: 'Sami Gharbi',
    email: 'contact@geoscan-topo.tn',
    website: 'https://geoscan-topo.tn',
    phone: '+216 71 845 210',
    reference: 'REF-ST-GEO-2024',
    notes: 'Levés topographiques LiDAR et photogrammétrie par drone.',
    updatedAt: '2025-10-02T09:00:00.000Z',
  },
  {
    id: 'sub-2',
    code: 'ST-002',
    name: 'LaboSol Géotechnique Maghreb',
    country: 'Maroc',
    domains: ['Génie Civil & Infrastructures', 'Hydraulique & Assainissement'],
    contactName: 'Rachid Berrada',
    email: 'r.berrada@labosol.ma',
    website: 'https://labosol.ma',
    phone: '+212 522 98 41 12',
    reference: 'REF-ST-LAB-2023',
    notes: 'Sondages carottés, essais pressiométriques et analyses bétons.',
    updatedAt: '2025-09-15T11:20:00.000Z',
  },
  {
    id: 'sub-3',
    code: 'ST-003',
    name: 'EcoMesures Atlantique',
    country: 'Sénégal',
    domains: ['Environnement & EIES', 'Énergie & Transition Climatique'],
    contactName: 'Awa Ndiaye',
    email: 'a.ndiaye@ecomesures.sn',
    website: 'https://ecomesures.sn',
    phone: '+221 33 824 19 00',
    reference: 'REF-ST-ECO-2025',
    notes: 'Campagnes acoustiques, qualité de l’air et prélèvements eaux.',
    updatedAt: '2025-11-01T15:00:00.000Z',
  },
  {
    id: 'sub-4',
    code: 'ST-004',
    name: 'HexaTraduction Technique',
    country: 'France',
    domains: ['Gouvernance & Secteur Public', 'Finance Publique & Audit'],
    contactName: 'Julien Lefèvre',
    email: 'projets@hexatrad.fr',
    website: 'https://hexatrad.fr',
    phone: '+33 1 42 68 55 10',
    reference: 'REF-ST-TRAD-2024',
    notes: 'Traduction assermentée de dossiers d’appel d’offres FR/EN/AR.',
    updatedAt: '2025-08-29T10:30:00.000Z',
  },
];

export const INITIAL_PARTNERS: Partner[] = [
  {
    id: 'prt-1',
    code: 'PRT-001',
    name: 'HydroConsult Méditerranée',
    country: 'Tunisie',
    domains: ['Hydraulique & Assainissement', 'Transport & Mobilité'],
    reference: 'REF-PART-HCM-2023',
    expertIds: ['exp-1', 'exp-5'],
    email: 'direction@hydroconsult-med.tn',
    website: 'https://hydroconsult-med.tn',
    notes: 'Partenaire historique en groupement sur les marchés BAD et AFD.',
    updatedAt: '2025-11-05T14:00:00.000Z',
  },
  {
    id: 'prt-2',
    code: 'PRT-002',
    name: 'EuroMed Énergie',
    country: 'France',
    domains: ['Énergie & Transition Climatique', 'Finance Publique & Audit'],
    reference: 'REF-PART-EME-2024',
    expertIds: ['exp-2', 'exp-4'],
    email: 'alliances@euromed-energie.fr',
    website: 'https://euromed-energie.fr',
    notes: 'Bureau d’études accrédité BEI / Union Européenne.',
    updatedAt: '2025-10-20T11:00:00.000Z',
  },
  {
    id: 'prt-3',
    code: 'PRT-003',
    name: 'AfriInfra Ingénierie',
    country: 'Sénégal',
    domains: ['Hydraulique & Assainissement', 'Systèmes d’Information & Data'],
    reference: 'REF-PART-AFI-2024',
    expertIds: ['exp-1', 'exp-3'],
    email: 'partenariats@afriinfra.sn',
    website: 'https://afriinfra.sn',
    notes: 'Couverture Afrique de l’Ouest (UEMOA).',
    updatedAt: '2025-09-30T17:15:00.000Z',
  },
];

export const INITIAL_DATABASE: AtlasDatabaseState = {
  experts: INITIAL_EXPERTS,
  subcontractors: INITIAL_SUBCONTRACTORS,
  partners: INITIAL_PARTNERS,
};

/**
 * Generates a clean minimal valid PDF binary blob for seeded sample attachments
 * so that preview, download, and ZIP bundle export work immediately without broken files.
 */
export function buildSamplePdfBlob(
  expertName: string,
  meta: DocumentAttachmentMeta
): Blob {
  const categoryLabel: Record<DocumentCategory, string> = {
    diplome: 'DIPLOME ACADEMIQUE',
    cv: 'CURRICULUM VITAE',
    reference: 'ATTESTATION DE REFERENCE',
    certificat: 'CERTIFICAT / ATTESTATION',
    administratif: 'DOCUMENT ADMINISTRATIF',
  };

  const escapePdfText = (input: string) =>
    input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

  const lines = [
    `GEREPBASE - DOSSIER DOCUMENTAIRE LOCAL`,
    `Categorie : ${categoryLabel[meta.category]}`,
    `Expert : ${expertName}`,
    `Fichier : ${meta.fileName}`,
    `Date d'archivage : ${meta.uploadedAt.slice(0, 10)}`,
    `Note : Document exemple pre-charge. Vous pouvez le remplacer`,
    `par le document PDF ou image reel depuis la fiche Expert.`,
  ];

  const streamLines = [
    'BT',
    '/F1 14 Tf',
    '50 750 Td',
    `(${escapePdfText(lines[0])}) Tj`,
    '/F1 11 Tf',
    ...lines.slice(1).map((line, idx) => `${idx === 0 ? '0 -34' : '0 -22'} Td (${escapePdfText(line)}) Tj`),
    'ET',
  ].join('\n');

  const pdfParts: string[] = [];
  const offsets: number[] = [];
  let cursor = 0;

  const pushPart = (str: string) => {
    pdfParts.push(str);
    cursor += new TextEncoder().encode(str).length;
  };

  pushPart('%PDF-1.4\n');

  const addObject = (num: number, body: string) => {
    offsets[num] = cursor;
    pushPart(`${num} 0 obj\n${body}\nendobj\n`);
  };

  addObject(1, '<< /Type /Catalog /Pages 2 0 R >>');
  addObject(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObject(
    3,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>'
  );
  addObject(
    4,
    `<< /Length ${new TextEncoder().encode(streamLines).length} >>\nstream\n${streamLines}\nendstream`
  );
  addObject(
    5,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  );

  const xrefStart = cursor;
  pushPart('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    pushPart(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  pushPart(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  return new Blob([pdfParts.join('')], { type: 'application/pdf' });
}
