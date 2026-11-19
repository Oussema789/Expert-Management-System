import {
  Edit3,
  ExternalLink,
  FileText,
  FilterX,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  DOCUMENT_CATEGORY_LABELS,
  DocumentAttachmentMeta,
  DocumentCategory,
  Expert,
  ExpertScope,
} from '../types/database';

interface ExpertsViewProps {
  experts: Expert[];
  onAddExpert: () => void;
  onEditExpert: (expert: Expert) => void;
  onDeleteExpert: (expertId: string) => void;
  onPreviewAttachment: (att: DocumentAttachmentMeta, expertName: string) => void;
}

const DOC_CATEGORIES: DocumentCategory[] = ['diplome', 'cv', 'reference', 'certificat'];

export function ExpertsView({
  experts,
  onAddExpert,
  onEditExpert,
  onDeleteExpert,
  onPreviewAttachment,
}: ExpertsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | ExpertScope>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [minExpFilter, setMinExpFilter] = useState<string>('0');
  const [referenceFilter, setReferenceFilter] = useState<string>('');

  const availableCountries = useMemo(
    () =>
      Array.from(new Set(experts.map((e) => e.country).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'fr')
      ),
    [experts]
  );

  const availableDomains = useMemo(
    () =>
      Array.from(new Set(experts.flatMap((e) => e.domains).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'fr')
      ),
    [experts]
  );

  const filteredExperts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const refQ = referenceFilter.trim().toLowerCase();
    const minYears = Number(minExpFilter) || 0;

    return experts.filter((expert) => {
      if (scopeFilter !== 'all' && expert.scope !== scopeFilter) return false;
      if (countryFilter !== 'all' && expert.country !== countryFilter) return false;
      if (domainFilter !== 'all' && !expert.domains.includes(domainFilter)) return false;
      if (expert.yearsExperience < minYears) return false;
      if (refQ && !expert.reference.toLowerCase().includes(refQ)) return false;

      if (q) {
        const haystack = [
          expert.code,
          expert.lastName,
          expert.firstName,
          expert.email,
          expert.nationality,
          expert.country,
          expert.reference,
          expert.domains.join(' '),
          expert.projects.map((p) => `${p.title} ${p.completionYear}`).join(' '),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [experts, searchQuery, scopeFilter, domainFilter, countryFilter, minExpFilter, referenceFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    scopeFilter !== 'all' ||
    domainFilter !== 'all' ||
    countryFilter !== 'all' ||
    minExpFilter !== '0' ||
    referenceFilter.trim() !== '';

  const resetFilters = () => {
    setSearchQuery('');
    setScopeFilter('all');
    setDomainFilter('all');
    setCountryFilter('all');
    setMinExpFilter('0');
    setReferenceFilter('');
  };

  return (
    <div className="space-y-4">
      {/* Header & Primary Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Base des Experts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filtrage par portée (International / Nationale), domaines, années d’expérience, référence et pays.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddExpert}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gerep-blue rounded-lg hover:bg-gerep-blue-dark transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nouvel Expert
        </button>
      </div>

      {/* Multi-criteria Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher nom, prénom, email, nationalité, projet..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
            />
          </div>

          {/* Segmented Scope Filter: International / Nationale */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            {(['all', 'International', 'Nationale'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setScopeFilter(opt)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  scopeFilter === opt
                    ? 'bg-white text-gerep-blue shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt === 'all' ? 'Tous' : opt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Filter: Par Domaines */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Par Domaines
            </label>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
            >
              <option value="all">Tous les domaines</option>
              {availableDomains.map((dom) => (
                <option key={dom} value={dom}>
                  {dom}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Par Pays */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Par Pays
            </label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
            >
              <option value="all">Tous les pays</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Année d'experiences */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Années d’expérience
            </label>
            <select
              value={minExpFilter}
              onChange={(e) => setMinExpFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
            >
              <option value="0">Toutes expériences</option>
              <option value="5">5 ans et plus</option>
              <option value="10">10 ans et plus</option>
              <option value="15">15 ans et plus</option>
            </select>
          </div>

          {/* Filter: Reference */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Référence
            </label>
            <input
              type="text"
              value={referenceFilter}
              onChange={(e) => setReferenceFilter(e.target.value)}
              placeholder="Ex: REF-BAD..."
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="tabular-nums">
            <strong className="font-semibold text-slate-800">{filteredExperts.length}</strong>{' '}
            expert{filteredExperts.length > 1 ? 's' : ''} affiché
            {filteredExperts.length > 1 ? 's' : ''} sur {experts.length}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-gerep-blue hover:text-gerep-blue-dark font-medium"
            >
              <FilterX className="w-3.5 h-3.5" />
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet Grid Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredExperts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700">
              {experts.length === 0
                ? 'La base des experts est vide.'
                : 'Aucun expert ne correspond aux critères sélectionnés.'}
            </p>
            <p className="text-xs text-slate-500">
              {experts.length === 0
                ? 'Ajoutez votre premier expert avec ses pièces jointes (Diplôme, CV, Référence, Certificat) ou importez un fichier .xlsx.'
                : 'Ajustez vos filtres ou ajoutez un nouveau profil expert avec ses pièces jointes.'}
            </p>
            <div className="pt-1 flex items-center justify-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Effacer les filtres
                </button>
              )}
              <button
                type="button"
                onClick={onAddExpert}
                className="px-4 py-2 text-xs font-semibold text-white bg-gerep-blue hover:bg-gerep-blue-dark rounded-lg transition-colors"
              >
                Ajouter un expert
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Code</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Nom &amp; Prénom</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Portée</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Pays · Nationalité</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Domaines</th>
                  <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Exp.</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Référence</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Contact &amp; Web</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Documents joints</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Projets &amp; Année</th>
                  <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExperts.map((expert) => {
                  const fullName = `${expert.firstName} ${expert.lastName}`;
                  return (
                    <tr
                      key={expert.id}
                      className="hover:bg-slate-50/80 transition-colors align-top"
                    >
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {expert.code}
                      </td>
                      <td className="py-3 px-3 min-w-[160px]">
                        <button
                          type="button"
                          onClick={() => onEditExpert(expert)}
                          className="font-semibold text-slate-900 hover:text-gerep-blue text-left transition-colors"
                        >
                          {expert.lastName.toUpperCase()} {expert.firstName}
                        </button>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 font-medium">
                        {expert.scope}
                      </td>
                      <td className="py-3 px-3 min-w-[140px]">
                        <div className="font-medium text-slate-800">{expert.country}</div>
                        <div className="text-[11px] text-slate-500">
                          {expert.nationality || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-3 min-w-[200px] max-w-[260px] text-slate-700 leading-relaxed">
                        {expert.domains.length > 0 ? expert.domains.join(' · ') : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap text-slate-900 font-medium">
                        {expert.yearsExperience} ans
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                        {expert.reference || '—'}
                      </td>
                      <td className="py-3 px-3 min-w-[180px] space-y-1">
                        {expert.email ? (
                          <a
                            href={`mailto:${expert.email}`}
                            className="block text-gerep-blue hover:underline truncate max-w-[190px]"
                          >
                            {expert.email}
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {expert.website && (
                          <a
                            href={
                              expert.website.startsWith('http')
                                ? expert.website
                                : `https://${expert.website}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 truncate max-w-[190px]"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {expert.website.replace(/^https?:\/\//, '')}
                            </span>
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-3 min-w-[220px]">
                        <div className="grid grid-cols-2 gap-1">
                          {DOC_CATEGORIES.map((cat) => {
                            const matches = expert.attachments.filter((a) => a.category === cat);
                            const label =
                              cat === 'certificat'
                                ? 'Certif.'
                                : DOCUMENT_CATEGORY_LABELS[cat];
                            if (matches.length === 0) {
                              return (
                                <span
                                  key={cat}
                                  className="text-[11px] text-slate-400 py-1 px-1.5"
                                >
                                  {label}: —
                                </span>
                              );
                            }
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => onPreviewAttachment(matches[0], fullName)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-gerep-forest hover:text-gerep-blue bg-emerald-50/60 hover:bg-sky-50 py-1 px-1.5 rounded transition-colors text-left truncate"
                                title={matches.map((m) => m.fileName).join(', ')}
                              >
                                <FileText className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {label}
                                  {matches.length > 1 ? ` (${matches.length})` : ''}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-3 min-w-[210px] max-w-[260px]">
                        {expert.projects.length === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <ul className="space-y-1">
                            {expert.projects.map((p) => (
                              <li key={p.id} className="text-[11px] text-slate-700 leading-snug">
                                <span className="font-mono tabular-nums font-semibold text-slate-900">
                                  {p.completionYear}
                                </span>{' '}
                                · {p.title}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditExpert(expert)}
                            className="p-1.5 text-slate-600 hover:text-gerep-blue hover:bg-sky-50 rounded-md transition-colors"
                            title="Modifier le dossier"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteExpert(expert.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
