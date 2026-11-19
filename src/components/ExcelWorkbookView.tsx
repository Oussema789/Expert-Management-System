import {
  CheckCircle2,
  Download,
  FileArchive,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import {
  buildAttachmentRelativePath,
  buildEntityAttachmentRelativePath,
} from '../excel/excelWorkbook';
import { AtlasDatabaseState, Expert } from '../types/database';

interface ExcelWorkbookViewProps {
  state: AtlasDatabaseState;
  onExportXlsx: () => void;
  onExportZip: () => void;
  onImportXlsx: (file: File) => Promise<void>;
  exportBusy: boolean;
}

type SheetPreviewTab =
  | 'dashboard'
  | 'experts'
  | 'subcontractors'
  | 'partners'
  | 'projects'
  | 'lists';

export function ExcelWorkbookView({
  state,
  onExportXlsx,
  onExportZip,
  onImportXlsx,
  exportBusy,
}: ExcelWorkbookViewProps) {
  const [activeSheet, setActiveSheet] = useState<SheetPreviewTab>('experts');
  const [importBusy, setImportBusy] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportBusy(true);
    try {
      await onImportXlsx(file);
    } finally {
      setImportBusy(false);
      e.target.value = '';
    }
  };

  const totalAttachments =
    state.experts.reduce((s, e) => s + e.attachments.length, 0) +
    state.subcontractors.reduce((s, sub) => s + (sub.adminDocuments?.length ?? 0), 0) +
    state.partners.reduce((s, prt) => s + (prt.adminDocuments?.length ?? 0), 0);
  const totalProjects = state.experts.reduce((s, e) => s + e.projects.length, 0);

  const sheetTabs: Array<{ id: SheetPreviewTab; name: string }> = [
    { id: 'dashboard', name: 'Tableau de Bord' },
    { id: 'experts', name: 'Les Experts' },
    { id: 'subcontractors', name: 'Les Sous-traitants' },
    { id: 'partners', name: 'Les Partenaires' },
    { id: 'projects', name: 'Projets & Réalisations' },
    { id: 'lists', name: 'Listes' },
  ];

  const uniqueCountries = Array.from(
    new Set([
      ...state.experts.map((e) => e.country),
      ...state.subcontractors.map((s) => s.country),
      ...state.partners.map((p) => p.country),
    ])
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'fr'));

  const uniqueDomains = Array.from(
    new Set([
      ...state.experts.flatMap((e) => e.domains),
      ...state.subcontractors.flatMap((s) => s.domains),
      ...state.partners.flatMap((p) => p.domains),
    ])
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'fr'));

  return (
    <div className="space-y-6">
      {/* Top Export / Import Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gerep-forest">
              <FileSpreadsheet className="w-4 h-4" />
              Générateur Excel local GEREP Environnement (.xlsx)
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Classeur Excel multi-feuilles &amp; Dossier local des pièces jointes
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Le fichier généré contient 6 onglets structurés avec filtres automatiques, volets
              figés, listes déroulantes (<span className="font-mono">Validation de données</span>)
              et formules Excel (<span className="font-mono">COUNTIF</span>,{' '}
              <span className="font-mono">COUNTA</span>,{' '}
              <span className="font-mono">AVERAGE</span>). En mode Pack Complet (.zip), chaque
              cellule Diplôme, CV, Référence, Certificat (Experts) et Documents administratifs
              (Sous-traitants &amp; Partenaires) contient un lien hypertexte local ouvrant
              directement le fichier correspondant sur votre ordinateur.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={exportBusy}
              onClick={onExportZip}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gerep-blue rounded-lg hover:bg-gerep-blue-dark transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <FileArchive className="w-4 h-4" />
              Télécharger Pack Excel + Docs (.zip) — {totalAttachments} fichier
              {totalAttachments > 1 ? 's' : ''}
            </button>
            <button
              type="button"
              disabled={exportBusy}
              onClick={onExportXlsx}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gerep-blue bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-gerep-forest" />
              Télécharger .xlsx uniquement
            </button>
          </div>
        </div>

        {/* Import .xlsx */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Importer un classeur Excel (.xlsx)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Modifiez vos tableaux localement dans Microsoft Excel ou LibreOffice Calc, puis
              réimportez le fichier <span className="font-mono">.xlsx</span> ici pour synchroniser
              la base.
            </p>
          </div>

          <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-gerep-blue rounded-lg p-5 bg-slate-50/70 hover:bg-sky-50/40 cursor-pointer transition-colors text-center">
            <Upload className="w-5 h-5 text-gerep-blue" />
            <span className="text-xs font-medium text-slate-800">
              {importBusy ? 'Lecture du classeur...' : 'Sélectionner un fichier .xlsx'}
            </span>
            <span className="text-[11px] text-slate-500">
              Feuilles lues : Les Experts, Les Sous-traitants, Les Partenaires
            </span>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              disabled={importBusy}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Capabilities checklist */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-gerep-forest shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-900">Formules dynamiques actives</div>
            <div className="text-slate-600 mt-0.5">
              COUNTIF par Pays, par Domaine et par Portée (International/Nationale) sur la feuille
              Tableau de Bord.
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-gerep-forest shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-900">Listes déroulantes &amp; Filtres</div>
            <div className="text-slate-600 mt-0.5">
              Validation de données native sur les colonnes Portée et Pays + AutoFilter sur chaque
              feuille.
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-gerep-forest shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-900">Liens locaux vers documents</div>
            <div className="text-slate-600 mt-0.5">
              Hyperliens relatifs <span className="font-mono">Documents/</span> vers les dossiers
              Experts, Sous-traitants et Partenaires.
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Workbook Sheet Preview */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-slate-800">
            Aperçu du classeur Excel généré
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            6 feuilles · {state.experts.length} experts · {totalProjects} projets
          </span>
        </div>

        {/* Sheet Content */}
        <div className="overflow-x-auto max-h-[420px]">
          {activeSheet === 'dashboard' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gerep-blue text-white">
                  <th className="py-2.5 px-3 font-mono w-10 border-r border-gerep-blue-dark">#</th>
                  <th className="py-2.5 px-3 font-semibold border-r border-gerep-blue-dark">
                    A · Indicateur
                  </th>
                  <th className="py-2.5 px-3 font-semibold border-r border-gerep-blue-dark text-right">
                    B · Valeur calculée
                  </th>
                  <th className="py-2.5 px-3 font-semibold">C · Formule Excel intégrée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                <tr>
                  <td className="py-2 px-3 bg-slate-50 text-slate-500 border-r border-slate-200">
                    6
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900 border-r border-slate-200">
                    Total Experts enregistrés
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-gerep-blue border-r border-slate-200 tabular-nums">
                    {state.experts.length}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    =COUNTA(&apos;Les Experts&apos;!A2:A{Math.max(2, state.experts.length + 1)})
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 bg-slate-50 text-slate-500 border-r border-slate-200">
                    7
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900 border-r border-slate-200">
                    Experts Internationaux
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-gerep-blue border-r border-slate-200 tabular-nums">
                    {state.experts.filter((e) => e.scope === 'International').length}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    =COUNTIF(&apos;Les Experts&apos;!D2:D{Math.max(2, state.experts.length + 1)},&quot;International&quot;)
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 bg-slate-50 text-slate-500 border-r border-slate-200">
                    8
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900 border-r border-slate-200">
                    Experts Nationaux
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-gerep-blue border-r border-slate-200 tabular-nums">
                    {state.experts.filter((e) => e.scope === 'Nationale').length}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    =COUNTIF(&apos;Les Experts&apos;!D2:D{Math.max(2, state.experts.length + 1)},&quot;Nationale&quot;)
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 bg-slate-50 text-slate-500 border-r border-slate-200">
                    9
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900 border-r border-slate-200">
                    Moyenne années d’expérience
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-gerep-blue border-r border-slate-200 tabular-nums">
                    {state.experts.length > 0
                      ? (
                          state.experts.reduce((s, e) => s + e.yearsExperience, 0) /
                          state.experts.length
                        ).toFixed(1)
                      : '0.0'}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    =IFERROR(ROUND(AVERAGE(&apos;Les Experts&apos;!H2:H{Math.max(2, state.experts.length + 1)}),1),0)
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 bg-slate-50 text-slate-500 border-r border-slate-200">
                    10
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900 border-r border-slate-200">
                    Total Sous-traitants
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-gerep-blue border-r border-slate-200 tabular-nums">
                    {state.subcontractors.length}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    =COUNTA(&apos;Les Sous-traitants&apos;!A2:A{Math.max(2, state.subcontractors.length + 1)})
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 bg-slate-50 text-slate-500 border-r border-slate-200">
                    11
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900 border-r border-slate-200">
                    Total Partenaires
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-gerep-blue border-r border-slate-200 tabular-nums">
                    {state.partners.length}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    =COUNTA(&apos;Les Partenaires&apos;!A2:A{Math.max(2, state.partners.length + 1)})
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {activeSheet === 'experts' && (
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-gerep-blue text-white whitespace-nowrap">
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">A · Code</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">B · Nom</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">C · Prénom</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">D · Portée</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">E · Nationalité</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">F · Pays</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">G · Domaines</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark text-right">H · Exp.</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">I · Référence</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">J · Email</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">K · Site web</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">L · Projets &amp; Année</th>
                  <th className="py-2 px-2.5">M–P · Liens Diplôme / CV / Réf / Certif.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {state.experts.map((exp: Expert) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-2 px-2.5 font-mono border-r border-slate-200">{exp.code}</td>
                    <td className="py-2 px-2.5 border-r border-slate-200 font-medium">
                      {exp.lastName}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200">{exp.firstName}</td>
                    <td className="py-2 px-2.5 border-r border-slate-200">{exp.scope}</td>
                    <td className="py-2 px-2.5 border-r border-slate-200">{exp.nationality}</td>
                    <td className="py-2 px-2.5 border-r border-slate-200">{exp.country}</td>
                    <td className="py-2 px-2.5 border-r border-slate-200 max-w-[200px] truncate">
                      {exp.domains.join(', ')}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-right font-mono tabular-nums">
                      {exp.yearsExperience}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 font-mono">
                      {exp.reference}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200">{exp.email}</td>
                    <td className="py-2 px-2.5 border-r border-slate-200">{exp.website}</td>
                    <td className="py-2 px-2.5 border-r border-slate-200 max-w-[220px] truncate">
                      {exp.projects.map((p) => `${p.title} (${p.completionYear})`).join(' ; ')}
                    </td>
                    <td className="py-2 px-2.5 font-mono text-gerep-forest max-w-[220px] truncate">
                      {exp.attachments[0]
                        ? buildAttachmentRelativePath(exp, exp.attachments[0])
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSheet === 'subcontractors' && (
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-gerep-blue text-white whitespace-nowrap">
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">A · Code</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">B · Raison sociale</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">C · Pays</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">D · Domaines</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">E · Référence</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">F · Contact</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">G · Email</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">H · Site web</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">I · Téléphone</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">J · Notes</th>
                  <th className="py-2 px-2.5">K · Documents administratifs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {state.subcontractors.map((sub) => {
                  const docs = sub.adminDocuments ?? [];
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 font-mono border-r border-slate-200">{sub.code}</td>
                      <td className="py-2 px-2.5 font-medium border-r border-slate-200">{sub.name}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200">{sub.country}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200">
                        {sub.domains.join(', ')}
                      </td>
                      <td className="py-2 px-2.5 font-mono border-r border-slate-200">
                        {sub.reference}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200">{sub.contactName}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200">{sub.email}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200">{sub.website}</td>
                      <td className="py-2 px-2.5 font-mono border-r border-slate-200">{sub.phone}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200 max-w-[180px] truncate">
                        {sub.notes ?? ''}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-gerep-forest max-w-[220px] truncate">
                        {docs[0]
                          ? buildEntityAttachmentRelativePath('Sous-traitants', sub.code, sub.name, docs[0])
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeSheet === 'partners' && (
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-gerep-blue text-white whitespace-nowrap">
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">A · Code</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">B · Partenaire</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">C · Pays</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">D · Domaines</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">E · Référence</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">F · Leurs Experts</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark text-right">G · Nb Experts</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">H · Email</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">I · Site web</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">J · Notes</th>
                  <th className="py-2 px-2.5">K · Documents administratifs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {state.partners.map((prt) => {
                  const linked = prt.expertIds
                    .map((id) => state.experts.find((e) => e.id === id))
                    .filter((e): e is Expert => Boolean(e));
                  const docs = prt.adminDocuments ?? [];
                  return (
                    <tr key={prt.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 font-mono border-r border-slate-200">
                        {prt.code}
                      </td>
                      <td className="py-2 px-2.5 font-medium border-r border-slate-200">
                        {prt.name}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200">{prt.country}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200">
                        {prt.domains.join(', ')}
                      </td>
                      <td className="py-2 px-2.5 font-mono border-r border-slate-200">
                        {prt.reference}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200">
                        {linked.map((e) => `${e.firstName} ${e.lastName}`).join(', ') || '—'}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums border-r border-slate-200">
                        {linked.length}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200">{prt.email}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200">{prt.website}</td>
                      <td className="py-2 px-2.5 border-r border-slate-200 max-w-[180px] truncate">
                        {prt.notes ?? ''}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-gerep-forest max-w-[220px] truncate">
                        {docs[0]
                          ? buildEntityAttachmentRelativePath('Partenaires', prt.code, prt.name, docs[0])
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeSheet === 'projects' && (
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-gerep-blue text-white whitespace-nowrap">
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">A · ID Projet</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">B · Expert</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">C · Code Expert</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">E · Projet réalisé</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark text-right">
                    F · Année d’achèvement
                  </th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">G · Pays</th>
                  <th className="py-2 px-2.5">H · Domaine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {state.experts.flatMap((exp) =>
                  exp.projects.map((prj) => (
                    <tr key={`${exp.id}-${prj.id}`} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 font-mono border-r border-slate-200">
                        {prj.id.toUpperCase()}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-medium">
                        {exp.firstName} {exp.lastName}
                      </td>
                      <td className="py-2 px-2.5 font-mono border-r border-slate-200">
                        {exp.code}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200">{prj.title}</td>
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums border-r border-slate-200">
                        {prj.completionYear}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200">{prj.country}</td>
                      <td className="py-2 px-2.5">{prj.domain}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeSheet === 'lists' && (
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-gerep-blue text-white whitespace-nowrap">
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">A · Portée</th>
                  <th className="py-2 px-2.5 border-r border-gerep-blue-dark">B · Pays</th>
                  <th className="py-2 px-2.5">C · Domaines</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {Array.from({
                  length: Math.max(2, uniqueCountries.length, uniqueDomains.length),
                }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-2 px-2.5 border-r border-slate-200">
                      {i === 0 ? 'International' : i === 1 ? 'Nationale' : ''}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200">
                      {uniqueCountries[i] ?? ''}
                    </td>
                    <td className="py-2 px-2.5">{uniqueDomains[i] ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Excel-style Bottom Sheet Tabs */}
        <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-1 overflow-x-auto">
          {sheetTabs.map((tab) => {
            const active = activeSheet === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSheet(tab.id)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-gerep-blue font-semibold border border-slate-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
