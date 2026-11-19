import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { DEFAULT_COUNTRIES, DEFAULT_DOMAINS } from '../data/seedData';
import { getAttachmentBlob } from '../storage/localDb';
import {
  AtlasDatabaseState,
  DOCUMENT_CATEGORY_LABELS,
  DocumentAttachmentMeta,
  DocumentCategory,
  Expert,
  ExpertProject,
  ExpertScope,
  Partner,
  Subcontractor,
} from '../types/database';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF004B8D' }, // GEREP Corporate Blue
};

const SUBHEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFEDF7ED' }, // Soft GEREP Leaf Green tint
};

const ZEBRA_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8FAFC' },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

function sanitizeSegment(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildAttachmentRelativePath(
  expert: Expert,
  attachment: DocumentAttachmentMeta
): string {
  const folder = `${sanitizeSegment(expert.lastName)}_${sanitizeSegment(expert.firstName)}_${sanitizeSegment(expert.code)}`;
  const prefix = sanitizeSegment(DOCUMENT_CATEGORY_LABELS[attachment.category]);
  const cleanFile = sanitizeSegment(attachment.fileName);
  return `Documents/Experts/${folder}/${prefix}_${cleanFile}`;
}

export function buildEntityAttachmentRelativePath(
  rootFolder: 'Sous-traitants' | 'Partenaires',
  code: string,
  name: string,
  attachment: DocumentAttachmentMeta
): string {
  const folder = `${sanitizeSegment(name)}_${sanitizeSegment(code)}`;
  const cleanFile = sanitizeSegment(attachment.fileName);
  return `Documents/${rootFolder}/${folder}/${cleanFile}`;
}

function styleHeaderRow(row: ExcelJS.Row, colCount: number) {
  row.height = 28;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = HEADER_FILL;
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = THIN_BORDER;
  }
}

function styleDataRow(row: ExcelJS.Row, colCount: number, isEven: boolean) {
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    if (isEven) {
      cell.fill = ZEBRA_FILL;
    }
    cell.font = {
      name: 'Calibri',
      size: 10,
      color: { argb: 'FF0F172A' },
    };
    cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    cell.border = THIN_BORDER;
  }
}

function formatAttachmentCellText(
  attachments: DocumentAttachmentMeta[],
  category: DocumentCategory
): string {
  const matches = attachments.filter((a) => a.category === category);
  if (matches.length === 0) return '—';
  return matches.map((m) => m.fileName).join(' | ');
}

export interface BuildWorkbookOptions {
  includeLocalDocLinks?: boolean;
}

export async function buildExcelWorkbook(
  state: AtlasDatabaseState,
  options: BuildWorkbookOptions = {}
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GEREP Environnement';
  workbook.created = new Date();
  workbook.modified = new Date();

  const uniqueCountries = Array.from(
    new Set([
      ...DEFAULT_COUNTRIES,
      ...state.experts.map((e) => e.country).filter(Boolean),
      ...state.subcontractors.map((s) => s.country).filter(Boolean),
      ...state.partners.map((p) => p.country).filter(Boolean),
    ])
  ).sort((a, b) => a.localeCompare(b, 'fr'));

  const uniqueDomains = Array.from(
    new Set([
      ...DEFAULT_DOMAINS,
      ...state.experts.flatMap((e) => e.domains),
      ...state.subcontractors.flatMap((s) => s.domains),
      ...state.partners.flatMap((p) => p.domains),
    ])
  ).sort((a, b) => a.localeCompare(b, 'fr'));

  // -------------------------------------------------------------------------
  // 1. SHEET: Tableau de Bord (placed first for immediate executive view)
  // -------------------------------------------------------------------------
  const dashSheet = workbook.addWorksheet('Tableau de Bord', {
    views: [{ showGridLines: true }],
  });

  dashSheet.columns = [
    { width: 34 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 22 },
  ];

  dashSheet.mergeCells('A1:E1');
  const titleCell = dashSheet.getCell('A1');
  titleCell.value = 'GEREP ENVIRONNEMENT — BASE DE DONNÉES EXPERTS, SOUS-TRAITANTS & PARTENAIRES';
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = HEADER_FILL;
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  dashSheet.getRow(1).height = 34;

  dashSheet.mergeCells('A2:E2');
  const subTitleCell = dashSheet.getCell('A2');
  subTitleCell.value = `Export local GEREP Environnement généré le ${new Date().toLocaleDateString('fr-FR')} — Formules dynamiques actives`;
  subTitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF0B6B38' } };
  subTitleCell.fill = SUBHEADER_FILL;
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  dashSheet.getRow(2).height = 22;

  const expertsEndRow = Math.max(2, state.experts.length + 1);
  const subsEndRow = Math.max(2, state.subcontractors.length + 1);
  const partnersEndRow = Math.max(2, state.partners.length + 1);
  const totalProjectsCount = state.experts.reduce((sum, e) => sum + e.projects.length, 0);
  const projectsEndRow = Math.max(2, totalProjectsCount + 1);

  // KPI Section
  dashSheet.getCell('A4').value = 'INDICATEURS CLÉS (FORMULES EXCEL)';
  dashSheet.getCell('A4').font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };

  const kpiHeader = dashSheet.getRow(5);
  kpiHeader.values = ['Indicateur', 'Valeur', 'Détail / Formule'];
  styleHeaderRow(kpiHeader, 3);

  const kpiRows: Array<{ label: string; formula: string; result: number; note: string }> = [
    {
      label: 'Total Experts enregistrés',
      formula: `COUNTA('Les Experts'!A2:A${expertsEndRow})`,
      result: state.experts.length,
      note: 'Tous profils confondus',
    },
    {
      label: 'Experts Internationaux',
      formula: `COUNTIF('Les Experts'!D2:D${expertsEndRow},"International")`,
      result: state.experts.filter((e) => e.scope === 'International').length,
      note: 'Portée = International',
    },
    {
      label: 'Experts Nationaux',
      formula: `COUNTIF('Les Experts'!D2:D${expertsEndRow},"Nationale")`,
      result: state.experts.filter((e) => e.scope === 'Nationale').length,
      note: 'Portée = Nationale',
    },
    {
      label: 'Moyenne années d’expérience (Experts)',
      formula: `IFERROR(ROUND(AVERAGE('Les Experts'!H2:H${expertsEndRow}),1),0)`,
      result:
        state.experts.length > 0
          ? Number(
              (
                state.experts.reduce((acc, e) => acc + e.yearsExperience, 0) /
                state.experts.length
              ).toFixed(1)
            )
          : 0,
      note: 'En années',
    },
    {
      label: 'Total Sous-traitants',
      formula: `COUNTA('Les Sous-traitants'!A2:A${subsEndRow})`,
      result: state.subcontractors.length,
      note: 'Entreprises & prestataires',
    },
    {
      label: 'Total Partenaires',
      formula: `COUNTA('Les Partenaires'!A2:A${partnersEndRow})`,
      result: state.partners.length,
      note: 'Partenaires & leurs experts',
    },
    {
      label: 'Projets réalisés archivés',
      formula: `COUNTA('Projets & Réalisations'!A2:A${projectsEndRow})`,
      result: totalProjectsCount,
      note: 'Avec année d’achèvement',
    },
  ];

  kpiRows.forEach((item, idx) => {
    const r = dashSheet.getRow(6 + idx);
    r.getCell(1).value = item.label;
    r.getCell(2).value = { formula: item.formula, result: item.result };
    r.getCell(2).numFmt = item.label.includes('Moyenne') ? '0.0' : '#,##0';
    r.getCell(3).value = item.note;
    styleDataRow(r, 3, idx % 2 === 1);
    r.getCell(2).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF004B8D' } };
    r.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
  });

  // Breakdown by Country
  const countryStartRow = 15;
  dashSheet.getCell(`A${countryStartRow}`).value = 'RÉPARTITION PAR PAYS (FORMULES COUNTIF)';
  dashSheet.getCell(`A${countryStartRow}`).font = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FF0F172A' },
  };
  const countryHeader = dashSheet.getRow(countryStartRow + 1);
  countryHeader.values = ['Pays', 'Experts', 'Sous-traitants', 'Partenaires', 'Total Entités'];
  styleHeaderRow(countryHeader, 5);

  uniqueCountries.forEach((country, idx) => {
    const rowIdx = countryStartRow + 2 + idx;
    const r = dashSheet.getRow(rowIdx);
    const expCount = state.experts.filter((e) => e.country === country).length;
    const subCount = state.subcontractors.filter((s) => s.country === country).length;
    const prtCount = state.partners.filter((p) => p.country === country).length;

    r.getCell(1).value = country;
    r.getCell(2).value = {
      formula: `COUNTIF('Les Experts'!$F$2:$F$${expertsEndRow},A${rowIdx})`,
      result: expCount,
    };
    r.getCell(3).value = {
      formula: `COUNTIF('Les Sous-traitants'!$C$2:$C$${subsEndRow},A${rowIdx})`,
      result: subCount,
    };
    r.getCell(4).value = {
      formula: `COUNTIF('Les Partenaires'!$C$2:$C$${partnersEndRow},A${rowIdx})`,
      result: prtCount,
    };
    r.getCell(5).value = {
      formula: `SUM(B${rowIdx}:D${rowIdx})`,
      result: expCount + subCount + prtCount,
    };
    styleDataRow(r, 5, idx % 2 === 1);
    for (let c = 2; c <= 5; c++) {
      r.getCell(c).alignment = { vertical: 'middle', horizontal: 'right' };
      r.getCell(c).numFmt = '#,##0';
    }
  });

  // Breakdown by Domain
  const domainStartRow = countryStartRow + uniqueCountries.length + 4;
  dashSheet.getCell(`A${domainStartRow}`).value = 'RÉPARTITION PAR DOMAINE (FORMULES COUNTIF)';
  dashSheet.getCell(`A${domainStartRow}`).font = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FF0F172A' },
  };
  const domainHeader = dashSheet.getRow(domainStartRow + 1);
  domainHeader.values = ['Domaine', 'Experts', 'Sous-traitants', 'Partenaires', 'Total Mentions'];
  styleHeaderRow(domainHeader, 5);

  uniqueDomains.forEach((domain, idx) => {
    const rowIdx = domainStartRow + 2 + idx;
    const r = dashSheet.getRow(rowIdx);
    const expCount = state.experts.filter((e) => e.domains.includes(domain)).length;
    const subCount = state.subcontractors.filter((s) => s.domains.includes(domain)).length;
    const prtCount = state.partners.filter((p) => p.domains.includes(domain)).length;

    r.getCell(1).value = domain;
    r.getCell(2).value = {
      formula: `COUNTIF('Les Experts'!$G$2:$G$${expertsEndRow},"*"&A${rowIdx}&"*")`,
      result: expCount,
    };
    r.getCell(3).value = {
      formula: `COUNTIF('Les Sous-traitants'!$D$2:$D$${subsEndRow},"*"&A${rowIdx}&"*")`,
      result: subCount,
    };
    r.getCell(4).value = {
      formula: `COUNTIF('Les Partenaires'!$D$2:$D$${partnersEndRow},"*"&A${rowIdx}&"*")`,
      result: prtCount,
    };
    r.getCell(5).value = {
      formula: `SUM(B${rowIdx}:D${rowIdx})`,
      result: expCount + subCount + prtCount,
    };
    styleDataRow(r, 5, idx % 2 === 1);
    for (let c = 2; c <= 5; c++) {
      r.getCell(c).alignment = { vertical: 'middle', horizontal: 'right' };
      r.getCell(c).numFmt = '#,##0';
    }
  });

  // -------------------------------------------------------------------------
  // 2. SHEET: Les Experts
  // -------------------------------------------------------------------------
  const expSheet = workbook.addWorksheet('Les Experts', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  expSheet.columns = [
    { header: 'Code', key: 'code', width: 12 },
    { header: 'Nom', key: 'lastName', width: 18 },
    { header: 'Prénom', key: 'firstName', width: 18 },
    { header: 'Portée (Int./Nat.)', key: 'scope', width: 18 },
    { header: 'Nationalité', key: 'nationality', width: 16 },
    { header: 'Pays', key: 'country', width: 16 },
    { header: 'Domaines', key: 'domains', width: 34 },
    { header: 'Années d’exp.', key: 'yearsExperience', width: 14 },
    { header: 'Référence', key: 'reference', width: 22 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Site web', key: 'website', width: 26 },
    { header: 'Projets réalisés & Année d’achèvement', key: 'projectsSummary', width: 42 },
    { header: 'Attachement : Diplôme', key: 'diplome', width: 28 },
    { header: 'Attachement : CV', key: 'cv', width: 28 },
    { header: 'Attachement : Référence', key: 'docRef', width: 28 },
    { header: 'Attachement : Certificats / Attestations', key: 'certificat', width: 32 },
  ];

  styleHeaderRow(expSheet.getRow(1), 16);
  expSheet.autoFilter = 'A1:P1';

  state.experts.forEach((expert, idx) => {
    const projectsSummary =
      expert.projects.length > 0
        ? expert.projects
            .map((p) => `${p.title} (${p.completionYear})`)
            .join(' ; ')
        : '—';

    const row = expSheet.addRow([
      expert.code,
      expert.lastName,
      expert.firstName,
      expert.scope,
      expert.nationality,
      expert.country,
      expert.domains.join(', '),
      expert.yearsExperience,
      expert.reference,
      expert.email,
      expert.website,
      projectsSummary,
      formatAttachmentCellText(expert.attachments, 'diplome'),
      formatAttachmentCellText(expert.attachments, 'cv'),
      formatAttachmentCellText(expert.attachments, 'reference'),
      formatAttachmentCellText(expert.attachments, 'certificat'),
    ]);

    styleDataRow(row, 16, idx % 2 === 1);
    row.getCell(8).alignment = { vertical: 'top', horizontal: 'right' };
    row.getCell(8).numFmt = '0';

    if (expert.email) {
      row.getCell(10).value = {
        text: expert.email,
        hyperlink: `mailto:${expert.email}`,
      };
      row.getCell(10).font = {
        name: 'Calibri',
        size: 10,
        color: { argb: 'FF004B8D' },
        underline: true,
      };
    }

    if (expert.website) {
      const normalizedUrl = expert.website.startsWith('http')
        ? expert.website
        : `https://${expert.website}`;
      row.getCell(11).value = {
        text: expert.website,
        hyperlink: normalizedUrl,
      };
      row.getCell(11).font = {
        name: 'Calibri',
        size: 10,
        color: { argb: 'FF004B8D' },
        underline: true,
      };
    }

    if (options.includeLocalDocLinks) {
      const linkCategories: Array<{ cat: DocumentCategory; col: number }> = [
        { cat: 'diplome', col: 13 },
        { cat: 'cv', col: 14 },
        { cat: 'reference', col: 15 },
        { cat: 'certificat', col: 16 },
      ];
      for (const item of linkCategories) {
        const matches = expert.attachments.filter((a) => a.category === item.cat);
        if (matches.length > 0) {
          const first = matches[0];
          const relPath = buildAttachmentRelativePath(expert, first);
          const label =
            matches.length === 1
              ? first.fileName
              : `${first.fileName} (+${matches.length - 1})`;
          row.getCell(item.col).value = {
            text: label,
            hyperlink: relPath,
          };
          row.getCell(item.col).font = {
            name: 'Calibri',
            size: 10,
            color: { argb: 'FF0B6B38' },
            underline: true,
          };
        }
      }
    }
  });

  // -------------------------------------------------------------------------
  // 3. SHEET: Les Sous-traitants
  // -------------------------------------------------------------------------
  const subSheet = workbook.addWorksheet('Les Sous-traitants', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  subSheet.columns = [
    { header: 'Code', key: 'code', width: 12 },
    { header: 'Nom / Raison sociale', key: 'name', width: 30 },
    { header: 'Pays', key: 'country', width: 18 },
    { header: 'Domaines', key: 'domains', width: 36 },
    { header: 'Référence', key: 'reference', width: 22 },
    { header: 'Contact principal', key: 'contactName', width: 22 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Site web', key: 'website', width: 26 },
    { header: 'Téléphone', key: 'phone', width: 20 },
    { header: 'Notes', key: 'notes', width: 32 },
    { header: 'Documents administratifs', key: 'adminDocuments', width: 34 },
  ];

  styleHeaderRow(subSheet.getRow(1), 11);
  subSheet.autoFilter = 'A1:K1';

  state.subcontractors.forEach((sub, idx) => {
    const adminDocs = sub.adminDocuments ?? [];
    const docsText =
      adminDocs.length > 0 ? adminDocs.map((d) => d.fileName).join(' | ') : '—';

    const row = subSheet.addRow([
      sub.code,
      sub.name,
      sub.country,
      sub.domains.join(', '),
      sub.reference,
      sub.contactName,
      sub.email,
      sub.website,
      sub.phone,
      sub.notes ?? '',
      docsText,
    ]);
    styleDataRow(row, 11, idx % 2 === 1);

    if (options.includeLocalDocLinks && adminDocs.length > 0) {
      const first = adminDocs[0];
      const relPath = buildEntityAttachmentRelativePath(
        'Sous-traitants',
        sub.code,
        sub.name,
        first
      );
      const label =
        adminDocs.length === 1
          ? first.fileName
          : `${first.fileName} (+${adminDocs.length - 1})`;
      row.getCell(11).value = { text: label, hyperlink: relPath };
      row.getCell(11).font = {
        name: 'Calibri',
        size: 10,
        color: { argb: 'FF0B6B38' },
        underline: true,
      };
    }
  });

  // -------------------------------------------------------------------------
  // 4. SHEET: Les Partenaires
  // -------------------------------------------------------------------------
  const prtSheet = workbook.addWorksheet('Les Partenaires', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  prtSheet.columns = [
    { header: 'Code', key: 'code', width: 12 },
    { header: 'Nom du Partenaire', key: 'name', width: 30 },
    { header: 'Pays', key: 'country', width: 18 },
    { header: 'Domaines', key: 'domains', width: 36 },
    { header: 'Référence', key: 'reference', width: 24 },
    { header: 'Leurs Experts', key: 'experts', width: 38 },
    { header: 'Nb Experts', key: 'expertCount', width: 13 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Site web', key: 'website', width: 26 },
    { header: 'Notes', key: 'notes', width: 30 },
    { header: 'Documents administratifs', key: 'adminDocuments', width: 34 },
  ];

  styleHeaderRow(prtSheet.getRow(1), 11);
  prtSheet.autoFilter = 'A1:K1';

  state.partners.forEach((prt, idx) => {
    const linkedExperts = prt.expertIds
      .map((id) => state.experts.find((e) => e.id === id))
      .filter((e): e is Expert => Boolean(e));
    const expertNames =
      linkedExperts.length > 0
        ? linkedExperts.map((e) => `${e.firstName} ${e.lastName} (${e.code})`).join(', ')
        : '—';

    const adminDocs = prt.adminDocuments ?? [];
    const docsText =
      adminDocs.length > 0 ? adminDocs.map((d) => d.fileName).join(' | ') : '—';

    const row = prtSheet.addRow([
      prt.code,
      prt.name,
      prt.country,
      prt.domains.join(', '),
      prt.reference,
      expertNames,
      linkedExperts.length,
      prt.email,
      prt.website,
      prt.notes ?? '',
      docsText,
    ]);
    styleDataRow(row, 11, idx % 2 === 1);
    row.getCell(7).alignment = { vertical: 'top', horizontal: 'right' };
    row.getCell(7).numFmt = '0';

    if (options.includeLocalDocLinks && adminDocs.length > 0) {
      const first = adminDocs[0];
      const relPath = buildEntityAttachmentRelativePath(
        'Partenaires',
        prt.code,
        prt.name,
        first
      );
      const label =
        adminDocs.length === 1
          ? first.fileName
          : `${first.fileName} (+${adminDocs.length - 1})`;
      row.getCell(11).value = { text: label, hyperlink: relPath };
      row.getCell(11).font = {
        name: 'Calibri',
        size: 10,
        color: { argb: 'FF0B6B38' },
        underline: true,
      };
    }
  });

  // -------------------------------------------------------------------------
  // 5. SHEET: Projets & Réalisations
  // -------------------------------------------------------------------------
  const projSheet = workbook.addWorksheet('Projets & Réalisations', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  projSheet.columns = [
    { header: 'ID Projet', key: 'id', width: 14 },
    { header: 'Expert', key: 'expertName', width: 24 },
    { header: 'Code Expert', key: 'expertCode', width: 14 },
    { header: 'Portée', key: 'scope', width: 16 },
    { header: 'Projet réalisé ensemble', key: 'title', width: 40 },
    { header: 'Année d’achèvement', key: 'completionYear', width: 18 },
    { header: 'Pays', key: 'country', width: 16 },
    { header: 'Domaine', key: 'domain', width: 30 },
    { header: 'Partenaire associé', key: 'partnerName', width: 28 },
    { header: 'Référence', key: 'referenceCode', width: 22 },
  ];

  styleHeaderRow(projSheet.getRow(1), 10);
  projSheet.autoFilter = 'A1:J1';

  let projRowCounter = 0;
  state.experts.forEach((expert) => {
    expert.projects.forEach((project) => {
      const row = projSheet.addRow([
        project.id.toUpperCase(),
        `${expert.firstName} ${expert.lastName}`,
        expert.code,
        expert.scope,
        project.title,
        project.completionYear,
        project.country,
        project.domain,
        project.partnerName ?? '—',
        project.referenceCode ?? expert.reference,
      ]);
      styleDataRow(row, 10, projRowCounter % 2 === 1);
      row.getCell(6).alignment = { vertical: 'top', horizontal: 'right' };
      row.getCell(6).numFmt = '0';
      projRowCounter++;
    });
  });

  // -------------------------------------------------------------------------
  // 6. SHEET: Listes (for Excel native Data Validation dropdowns)
  // -------------------------------------------------------------------------
  const listsSheet = workbook.addWorksheet('Listes', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  listsSheet.columns = [
    { header: 'Portée', key: 'scope', width: 18 },
    { header: 'Pays', key: 'country', width: 24 },
    { header: 'Domaines', key: 'domain', width: 36 },
  ];
  styleHeaderRow(listsSheet.getRow(1), 3);

  const maxListLen = Math.max(2, uniqueCountries.length, uniqueDomains.length);
  for (let i = 0; i < maxListLen; i++) {
    const scopeVal = i === 0 ? 'International' : i === 1 ? 'Nationale' : '';
    const countryVal = uniqueCountries[i] ?? '';
    const domainVal = uniqueDomains[i] ?? '';
    const r = listsSheet.addRow([scopeVal, countryVal, domainVal]);
    styleDataRow(r, 3, i % 2 === 1);
  }

  // Apply Excel Data Validation dropdowns across generous editable rows (2..200)
  const countryRange = `Listes!$B$2:$B$${Math.max(2, uniqueCountries.length + 1)}`;
  for (let r = 2; r <= 200; r++) {
    expSheet.getCell(`D${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['Listes!$A$2:$A$3'],
    };
    expSheet.getCell(`F${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [countryRange],
    };
    subSheet.getCell(`C${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [countryRange],
    };
    prtSheet.getCell(`C${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [countryRange],
    };
  }

  return workbook;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function exportExcelOnly(state: AtlasDatabaseState): Promise<void> {
  const workbook = await buildExcelWorkbook(state, { includeLocalDocLinks: false });
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const stamp = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `GEREP_Base_Donnees_${stamp}.xlsx`);
}

export async function exportFullZipBundle(state: AtlasDatabaseState): Promise<{
  attachedFilesCount: number;
}> {
  const workbook = await buildExcelWorkbook(state, { includeLocalDocLinks: true });
  const xlsxBuffer = await workbook.xlsx.writeBuffer();

  const zip = new JSZip();
  const stamp = new Date().toISOString().slice(0, 10);
  zip.file(`GEREP_Base_Donnees_${stamp}.xlsx`, xlsxBuffer);

  let attachedFilesCount = 0;
  for (const expert of state.experts) {
    for (const att of expert.attachments) {
      const blob = await getAttachmentBlob(att.id);
      if (blob) {
        const relPath = buildAttachmentRelativePath(expert, att);
        const arrayBuf = await blob.arrayBuffer();
        zip.file(relPath, arrayBuf);
        attachedFilesCount++;
      }
    }
  }

  for (const sub of state.subcontractors) {
    for (const att of sub.adminDocuments ?? []) {
      const blob = await getAttachmentBlob(att.id);
      if (blob) {
        const relPath = buildEntityAttachmentRelativePath(
          'Sous-traitants',
          sub.code,
          sub.name,
          att
        );
        const arrayBuf = await blob.arrayBuffer();
        zip.file(relPath, arrayBuf);
        attachedFilesCount++;
      }
    }
  }

  for (const prt of state.partners) {
    for (const att of prt.adminDocuments ?? []) {
      const blob = await getAttachmentBlob(att.id);
      if (blob) {
        const relPath = buildEntityAttachmentRelativePath(
          'Partenaires',
          prt.code,
          prt.name,
          att
        );
        const arrayBuf = await blob.arrayBuffer();
        zip.file(relPath, arrayBuf);
        attachedFilesCount++;
      }
    }
  }

  const readme = [
    'GEREP ENVIRONNEMENT — PACK LOCAL EXCEL & DOCUMENTS',
    '==================================================',
    `Généré le : ${new Date().toLocaleString('fr-FR')}`,
    '',
    'Contenu de cette archive :',
    `1. GEREP_Base_Donnees_${stamp}.xlsx : Classeur Excel multi-feuilles avec formules dynamiques,`,
    '   filtres automatiques, listes déroulantes et liens hypertextes vers les documents locaux.',
    '2. Documents/Experts/... : Diplômes, CV, Références et Certificats / Attestations.',
    '3. Documents/Sous-traitants/... et Documents/Partenaires/... : Documents administratifs.',
    '',
    'Conseil d’utilisation :',
    'Décompressez toute l’archive dans un même dossier sur votre ordinateur avant d’ouvrir le',
    'fichier Excel afin que les liens cliquables vers les PDF/documents fonctionnent directement.',
  ].join('\n');

  zip.file('LISEZMOI.txt', readme);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(zipBlob, `GEREP_Pack_Complet_${stamp}.zip`);
  return { attachedFilesCount };
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text.trim();
    if ('result' in value && value.result !== undefined) return String(value.result).trim();
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((rt) => rt.text).join('').trim();
    }
  }
  return '';
}

function splitDomains(raw: string): string[] {
  return raw
    .split(/[,;|/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function importExcelFile(
  file: File,
  currentState: AtlasDatabaseState
): Promise<AtlasDatabaseState> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const now = new Date().toISOString();

  // Parse Projects sheet first so we can attach them cleanly to Experts
  const projectsByExpertCode = new Map<string, ExpertProject[]>();
  const projSheet = workbook.getWorksheet('Projets & Réalisations');
  if (projSheet) {
    projSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const projId = cellToString(row.getCell(1).value) || `prj-${Date.now()}-${rowNumber}`;
      const expertCode = cellToString(row.getCell(3).value);
      const title = cellToString(row.getCell(5).value);
      const yearRaw = Number(cellToString(row.getCell(6).value));
      const country = cellToString(row.getCell(7).value);
      const domain = cellToString(row.getCell(8).value);
      const partnerName = cellToString(row.getCell(9).value);
      const referenceCode = cellToString(row.getCell(10).value);

      if (!title || !expertCode) return;
      const list = projectsByExpertCode.get(expertCode) ?? [];
      list.push({
        id: projId.toLowerCase(),
        title,
        completionYear: Number.isFinite(yearRaw) && yearRaw > 1950 ? yearRaw : new Date().getFullYear(),
        country: country || '—',
        domain: domain || '—',
        partnerName: partnerName === '—' ? undefined : partnerName,
        referenceCode: referenceCode === '—' ? undefined : referenceCode,
      });
      projectsByExpertCode.set(expertCode, list);
    });
  }

  // Parse Experts
  const expSheet = workbook.getWorksheet('Les Experts');
  const importedExperts: Expert[] = [];
  if (expSheet) {
    expSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const code = cellToString(row.getCell(1).value);
      const lastName = cellToString(row.getCell(2).value);
      const firstName = cellToString(row.getCell(3).value);
      if (!lastName && !firstName) return;

      const scopeRaw = cellToString(row.getCell(4).value);
      const scope: ExpertScope =
        scopeRaw.toLowerCase().includes('nat') ? 'Nationale' : 'International';
      const nationality = cellToString(row.getCell(5).value);
      const country = cellToString(row.getCell(6).value);
      const domains = splitDomains(cellToString(row.getCell(7).value));
      const yearsExp = Number(cellToString(row.getCell(8).value)) || 0;
      const reference = cellToString(row.getCell(9).value);
      const email = cellToString(row.getCell(10).value);
      const website = cellToString(row.getCell(11).value);
      const inlineProjectsText = cellToString(row.getCell(12).value);

      const existing = currentState.experts.find(
        (e) => (code && e.code === code) || (email && e.email.toLowerCase() === email.toLowerCase())
      );

      let projects = projectsByExpertCode.get(code) ?? [];
      if (projects.length === 0 && inlineProjectsText && inlineProjectsText !== '—') {
        projects = inlineProjectsText
          .split(';')
          .map((chunk, idx) => {
            const trimmed = chunk.trim();
            const match = trimmed.match(/^(.*?)\s*\((\d{4})\)$/);
            return {
              id: `prj-imp-${rowNumber}-${idx}`,
              title: match ? match[1].trim() : trimmed,
              completionYear: match ? Number(match[2]) : new Date().getFullYear(),
              country: country || '—',
              domain: domains[0] || '—',
              referenceCode: reference || undefined,
            };
          })
          .filter((p) => p.title.length > 0);
      }

      importedExperts.push({
        id: existing?.id ?? `exp-${Date.now()}-${rowNumber}`,
        code: code || `EXP-${String(rowNumber - 1).padStart(3, '0')}`,
        lastName,
        firstName,
        scope,
        nationality,
        country,
        domains,
        yearsExperience: yearsExp,
        reference,
        email,
        website,
        attachments: existing?.attachments ?? [],
        projects: projects.length > 0 ? projects : existing?.projects ?? [],
        notes: existing?.notes,
        updatedAt: now,
      });
    });
  }

  // Parse Subcontractors
  const subSheet = workbook.getWorksheet('Les Sous-traitants');
  const importedSubs: Subcontractor[] = [];
  if (subSheet) {
    subSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const code = cellToString(row.getCell(1).value);
      const name = cellToString(row.getCell(2).value);
      if (!name) return;
      const country = cellToString(row.getCell(3).value);
      const domains = splitDomains(cellToString(row.getCell(4).value));
      const reference = cellToString(row.getCell(5).value);
      const contactName = cellToString(row.getCell(6).value);
      const email = cellToString(row.getCell(7).value);
      const website = cellToString(row.getCell(8).value);
      const phone = cellToString(row.getCell(9).value);
      const notes = cellToString(row.getCell(10).value);

      const existing = currentState.subcontractors.find(
        (s) => (code && s.code === code) || s.name.toLowerCase() === name.toLowerCase()
      );

      importedSubs.push({
        id: existing?.id ?? `sub-${Date.now()}-${rowNumber}`,
        code: code || `ST-${String(rowNumber - 1).padStart(3, '0')}`,
        name,
        country,
        domains,
        reference,
        contactName,
        email,
        website,
        phone,
        adminDocuments: existing?.adminDocuments ?? [],
        notes,
        updatedAt: now,
      });
    });
  }

  // Parse Partners
  const prtSheet = workbook.getWorksheet('Les Partenaires');
  const importedPartners: Partner[] = [];
  const expertPool = importedExperts.length > 0 ? importedExperts : currentState.experts;

  if (prtSheet) {
    prtSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const code = cellToString(row.getCell(1).value);
      const name = cellToString(row.getCell(2).value);
      if (!name) return;
      const country = cellToString(row.getCell(3).value);
      const domains = splitDomains(cellToString(row.getCell(4).value));
      const reference = cellToString(row.getCell(5).value);
      const expertsText = cellToString(row.getCell(6).value);
      const email = cellToString(row.getCell(8).value);
      const website = cellToString(row.getCell(9).value);
      const notes = cellToString(row.getCell(10).value);

      const matchedExpertIds = expertPool
        .filter((e) => {
          const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
          return (
            expertsText.toLowerCase().includes(fullName) ||
            (e.code && expertsText.includes(e.code))
          );
        })
        .map((e) => e.id);

      const existing = currentState.partners.find(
        (p) => (code && p.code === code) || p.name.toLowerCase() === name.toLowerCase()
      );

      importedPartners.push({
        id: existing?.id ?? `prt-${Date.now()}-${rowNumber}`,
        code: code || `PRT-${String(rowNumber - 1).padStart(3, '0')}`,
        name,
        country,
        domains,
        reference,
        expertIds: matchedExpertIds.length > 0 ? matchedExpertIds : existing?.expertIds ?? [],
        email,
        website,
        adminDocuments: existing?.adminDocuments ?? [],
        notes,
        updatedAt: now,
      });
    });
  }

  return {
    experts: importedExperts.length > 0 ? importedExperts : currentState.experts,
    subcontractors: importedSubs.length > 0 ? importedSubs : currentState.subcontractors,
    partners: importedPartners.length > 0 ? importedPartners : currentState.partners,
  };
}
