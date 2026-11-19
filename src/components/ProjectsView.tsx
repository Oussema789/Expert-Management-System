import { FilterX, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Expert } from '../types/database';

interface ProjectsViewProps {
  experts: Expert[];
  onOpenExpertDossier: (expert: Expert) => void;
}

export function ProjectsView({ experts, onOpenExpertDossier }: ProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');

  const rows = useMemo(() => {
    return experts.flatMap((expert) =>
      expert.projects.map((project) => ({
        expert,
        project,
      }))
    );
  }, [experts]);

  const years = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.project.completionYear))).sort((a, b) => b - a),
    [rows]
  );

  const countries = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.project.country).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'fr')
      ),
    [rows]
  );

  const domains = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.project.domain).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'fr')
      ),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows
      .filter(({ expert, project }) => {
        if (yearFilter !== 'all' && String(project.completionYear) !== yearFilter) return false;
        if (countryFilter !== 'all' && project.country !== countryFilter) return false;
        if (domainFilter !== 'all' && project.domain !== domainFilter) return false;
        if (q) {
          const hay = [
            project.title,
            String(project.completionYear),
            project.country,
            project.domain,
            project.partnerName ?? '',
            project.referenceCode ?? '',
            expert.firstName,
            expert.lastName,
            expert.code,
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.project.completionYear - a.project.completionYear);
  }, [rows, searchQuery, yearFilter, countryFilter, domainFilter]);

  const hasFilters =
    searchQuery.trim() !== '' ||
    yearFilter !== 'all' ||
    countryFilter !== 'all' ||
    domainFilter !== 'all';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Projets réalisés &amp; Années d’achèvement
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Vue consolidée de tous les projets réalisés avec nos experts (éditables depuis chaque fiche Expert).
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher projet, expert, partenaire..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
            />
          </div>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            aria-label="Filtrer par année d’achèvement"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
          >
            <option value="all">Année d’achèvement : Toutes</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            aria-label="Filtrer par pays"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
          >
            <option value="all">Pays : Tous</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            aria-label="Filtrer par domaine"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
          >
            <option value="all">Domaine : Tous</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="tabular-nums">
            <strong className="font-semibold text-slate-800">{filtered.length}</strong> projet
            {filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''} sur{' '}
            {rows.length}
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setYearFilter('all');
                setCountryFilter('all');
                setDomainFilter('all');
              }}
              className="inline-flex items-center gap-1 text-gerep-blue hover:text-gerep-blue-dark font-medium"
            >
              <FilterX className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Aucun projet trouvé. Ajoutez des projets depuis l’onglet Les Experts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">
                    Année d’achèvement
                  </th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Intitulé du Projet</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Expert mobilisé</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Portée</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Pays</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Domaine</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Partenaire associé</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Référence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map(({ expert, project }) => (
                  <tr
                    key={`${expert.id}-${project.id}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {project.completionYear}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 min-w-[220px]">
                      {project.title}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenExpertDossier(expert)}
                        className="text-gerep-blue hover:underline font-medium"
                      >
                        {expert.firstName} {expert.lastName}{' '}
                        <span className="font-mono text-[11px] text-slate-500">
                          ({expert.code})
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">{expert.scope}</td>
                    <td className="py-3 px-3 text-slate-800 whitespace-nowrap">
                      {project.country}
                    </td>
                    <td className="py-3 px-3 text-slate-700 min-w-[180px]">{project.domain}</td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {project.partnerName ?? '—'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {project.referenceCode ?? expert.reference ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
