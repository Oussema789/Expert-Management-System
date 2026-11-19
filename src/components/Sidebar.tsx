import {
  Briefcase,
  Building2,
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
  Trash2,
  Users,
} from 'lucide-react';
import { ActiveView } from '../types/database';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  counts: {
    experts: number;
    subcontractors: number;
    partners: number;
    projects: number;
    attachments: number;
  };
  onClearAll: () => void;
}

export function Sidebar({
  activeView,
  onSelectView,
  counts,
  onClearAll,
}: SidebarProps) {
  const navItems: Array<{
    id: ActiveView;
    label: string;
    sheetRef: string;
    count?: number;
    icon: typeof LayoutDashboard;
  }> = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      sheetRef: 'Feuille 1',
      icon: LayoutDashboard,
    },
    {
      id: 'experts',
      label: 'Les Experts',
      sheetRef: 'Feuille 2',
      count: counts.experts,
      icon: Users,
    },
    {
      id: 'subcontractors',
      label: 'Les Sous-traitants',
      sheetRef: 'Feuille 3',
      count: counts.subcontractors,
      icon: Building2,
    },
    {
      id: 'partners',
      label: 'Les Partenaires',
      sheetRef: 'Feuille 4',
      count: counts.partners,
      icon: Briefcase,
    },
    {
      id: 'projects',
      label: 'Projets & Réalisations',
      sheetRef: 'Feuille 5',
      count: counts.projects,
      icon: FolderKanban,
    },
    {
      id: 'workbook',
      label: 'Classeur Excel (.xlsx)',
      sheetRef: 'Export / Import',
      icon: FileSpreadsheet,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#F1F5F9] border-r border-slate-200 flex flex-col justify-between min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="px-4 pt-4 pb-4 border-b border-slate-200 bg-white">
          <div className="w-full h-24 overflow-hidden flex items-center justify-center">
            <img
              src="/assets/aistudio/image_0f156d61.png"
              alt="GEREP Environnement"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain scale-[1.28] translate-y-1"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500 leading-relaxed text-center">
            <span className="font-semibold text-gerep-blue">GerepBase</span> · Base de données
            locale &amp; classeur Excel.
          </p>
        </div>

        {/* Navigation Sheets */}
        <nav className="p-3 space-y-1" aria-label="Feuilles du classeur">
          <div className="px-2.5 pt-2 pb-1.5 text-[11px] font-medium text-slate-500">
            Feuilles de données
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors text-left focus-visible:outline-2 focus-visible:outline-gerep-blue ${
                  isActive
                    ? 'bg-white text-gerep-blue font-semibold border border-slate-200 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-gerep-forest' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </span>
                {item.count !== undefined && (
                  <span
                    className={`font-mono text-xs tabular-nums shrink-0 ${
                      isActive ? 'text-gerep-blue font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Local Storage Utilities */}
      <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-100/70">
        <div className="text-xs text-slate-600 space-y-1">
          <div className="flex items-center justify-between">
            <span>Stockage navigateur</span>
            <span className="font-mono tabular-nums text-slate-800 font-medium">
              Local (IndexedDB)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Pièces jointes archivées</span>
            <span className="font-mono tabular-nums text-slate-800 font-medium">
              {counts.attachments}
            </span>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={onClearAll}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-white border border-slate-200 rounded-md hover:bg-rose-50 transition-colors whitespace-nowrap"
            title="Vider toute la base locale"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Vider la base
          </button>
        </div>
      </div>
    </aside>
  );
}
