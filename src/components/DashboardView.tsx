import {
  ArrowRight,
  Download,
  FileArchive,
  FileSpreadsheet,
} from 'lucide-react';
import { useMemo } from 'react';
import {
  ActiveView,
  AtlasDatabaseState,
  DOCUMENT_CATEGORY_LABELS,
  DocumentCategory,
} from '../types/database';

interface DashboardViewProps {
  state: AtlasDatabaseState;
  onNavigate: (view: ActiveView) => void;
  onExportXlsx: () => void;
  onExportZip: () => void;
  exportBusy: boolean;
}

export function DashboardView({
  state,
  onNavigate,
  onExportXlsx,
  onExportZip,
  exportBusy,
}: DashboardViewProps) {
  const stats = useMemo(() => {
    const intlCount = state.experts.filter((e) => e.scope === 'International').length;
    const natCount = state.experts.filter((e) => e.scope === 'Nationale').length;
    const avgExp =
      state.experts.length > 0
        ? (
            state.experts.reduce((s, e) => s + e.yearsExperience, 0) /
            state.experts.length
          ).toFixed(1)
        : '0.0';
    const totalProjects = state.experts.reduce((s, e) => s + e.projects.length, 0);

    // Country distribution across all 3 databases
    const countryMap = new Map<
      string,
      { experts: number; subs: number; partners: number }
    >();
    const bumpCountry = (
      country: string,
      key: 'experts' | 'subs' | 'partners'
    ) => {
      if (!country) return;
      const cur = countryMap.get(country) ?? { experts: 0, subs: 0, partners: 0 };
      cur[key] += 1;
      countryMap.set(country, cur);
    };
    state.experts.forEach((e) => bumpCountry(e.country, 'experts'));
    state.subcontractors.forEach((s) => bumpCountry(s.country, 'subs'));
    state.partners.forEach((p) => bumpCountry(p.country, 'partners'));

    const countries = Array.from(countryMap.entries())
      .map(([name, counts]) => ({
        name,
        ...counts,
        total: counts.experts + counts.subs + counts.partners,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Domain distribution across all 3 databases
    const domainMap = new Map<
      string,
      { experts: number; subs: number; partners: number }
    >();
    const bumpDomain = (domain: string, key: 'experts' | 'subs' | 'partners') => {
      if (!domain) return;
      const cur = domainMap.get(domain) ?? { experts: 0, subs: 0, partners: 0 };
      cur[key] += 1;
      domainMap.set(domain, cur);
    };
    state.experts.forEach((e) => e.domains.forEach((d) => bumpDomain(d, 'experts')));
    state.subcontractors.forEach((s) => s.domains.forEach((d) => bumpDomain(d, 'subs')));
    state.partners.forEach((p) => p.domains.forEach((d) => bumpDomain(d, 'partners')));

    const domains = Array.from(domainMap.entries())
      .map(([name, counts]) => ({
        name,
        ...counts,
        total: counts.experts + counts.subs + counts.partners,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Document completeness among Experts
    const docCoverage: Array<{ category: DocumentCategory; label: string; count: number }> = (
      ['diplome', 'cv', 'reference', 'certificat'] as DocumentCategory[]
    ).map((cat) => ({
      category: cat,
      label: DOCUMENT_CATEGORY_LABELS[cat],
      count: state.experts.filter((e) =>
        e.attachments.some((a) => a.category === cat)
      ).length,
    }));

    return {
      intlCount,
      natCount,
      avgExp,
      totalProjects,
      countries,
      domains,
      docCoverage,
    };
  }, [state]);

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="text-xs font-semibold text-gerep-forest">
            GEREP Environnement · Synthèse locale &amp; Classeur multi-feuilles
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bases de données Experts, Sous-traitants &amp; Partenaires
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Gérez vos dossiers localement avec pièces jointes (Diplôme, CV, Référence,
            Certificats) et générez à tout moment un fichier Excel{' '}
            <span className="font-mono text-xs text-slate-800">.xlsx</span> avec formules, filtres
            et listes déroulantes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={exportBusy}
            onClick={onExportXlsx}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gerep-blue bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-gerep-forest" />
            Exporter .xlsx seul
          </button>
          <button
            type="button"
            disabled={exportBusy}
            onClick={onExportZip}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gerep-blue rounded-lg hover:bg-gerep-blue-dark transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <FileArchive className="w-4 h-4" />
            Pack Excel + Documents (.zip)
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('experts')}
          className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-gerep-blue/60 transition-colors"
        >
          <div className="text-xs font-medium text-slate-500">Les Experts</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-gerep-blue">
              {state.experts.length}
            </span>
            <span className="text-xs text-slate-600 tabular-nums">
              {stats.intlCount} Int. · {stats.natCount} Nat.
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 tabular-nums">
            Moyenne d’expérience : <strong className="text-slate-700">{stats.avgExp} ans</strong>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('subcontractors')}
          className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-gerep-blue/60 transition-colors"
        >
          <div className="text-xs font-medium text-slate-500">Les Sous-traitants</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-gerep-blue">
              {state.subcontractors.length}
            </span>
            <span className="text-xs text-gerep-forest inline-flex items-center gap-1 font-medium">
              Ouvrir <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Classés par Pays &amp; par Domaines
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('partners')}
          className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-gerep-blue/60 transition-colors"
        >
          <div className="text-xs font-medium text-slate-500">Les Partenaires</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-gerep-blue">
              {state.partners.length}
            </span>
            <span className="text-xs text-gerep-forest inline-flex items-center gap-1 font-medium">
              Ouvrir <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Liés à leurs Experts &amp; Références
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('projects')}
          className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-gerep-blue/60 transition-colors"
        >
          <div className="text-xs font-medium text-slate-500">Projets &amp; Réalisations</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-gerep-blue">
              {stats.totalProjects}
            </span>
            <span className="text-xs text-gerep-forest inline-flex items-center gap-1 font-medium">
              Ouvrir <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Projets exécutés &amp; années d’achèvement
          </div>
        </button>
      </div>

      {/* Country & Domain Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Répartition par Pays</h2>
            <span className="text-xs font-mono text-slate-500">Formule Excel COUNTIF</span>
          </div>
          {stats.countries.length === 0 ? (
            <div className="p-6 text-xs text-slate-500">Aucune donnée par pays.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2.5 px-4 font-medium">Pays</th>
                  <th className="py-2.5 px-3 text-right font-medium">Experts</th>
                  <th className="py-2.5 px-3 text-right font-medium">Sous-traitants</th>
                  <th className="py-2.5 px-3 text-right font-medium">Partenaires</th>
                  <th className="py-2.5 px-4 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {stats.countries.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-medium text-slate-900">{row.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {row.experts}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {row.subs}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {row.partners}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-gerep-blue">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Répartition par Domaine</h2>
            <span className="text-xs font-mono text-slate-500">Multi-domaines</span>
          </div>
          {stats.domains.length === 0 ? (
            <div className="p-6 text-xs text-slate-500">Aucune donnée par domaine.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2.5 px-4 font-medium">Domaine</th>
                  <th className="py-2.5 px-3 text-right font-medium">Experts</th>
                  <th className="py-2.5 px-3 text-right font-medium">Sous-traitants</th>
                  <th className="py-2.5 px-4 text-right font-medium">Partenaires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {stats.domains.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-medium text-slate-900">{row.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {row.experts}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {row.subs}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {row.partners}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Document Completeness Audit */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Complétude des dossiers documentaires (Experts)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Suivi des 4 types de pièces jointes obligatoires ou recommandées : Diplôme, CV,
              Référence et Certificats / Attestations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('workbook')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gerep-blue hover:text-gerep-blue-dark"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Inspecter la structure Excel (.xlsx)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.docCoverage.map((item) => {
            const total = state.experts.length;
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div
                key={item.category}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800">{item.label}</span>
                  <span className="font-mono tabular-nums text-slate-600">
                    {item.count}/{total}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gerep-leaf transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-500">
                  {pct}% des experts documentés
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
