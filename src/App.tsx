import {
  CheckCircle2,
  Download,
  FileArchive,
  Menu,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DashboardView } from './components/DashboardView';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { ExcelWorkbookView } from './components/ExcelWorkbookView';
import { ExpertModal } from './components/ExpertModal';
import { ExpertsView } from './components/ExpertsView';
import { PartnersView } from './components/PartnersView';
import { ProjectsView } from './components/ProjectsView';
import { Sidebar } from './components/Sidebar';
import { SubcontractorsView } from './components/SubcontractorsView';
import { DEFAULT_COUNTRIES, DEFAULT_DOMAINS } from './data/seedData';
import {
  exportExcelOnly,
  exportFullZipBundle,
  importExcelFile,
} from './excel/excelWorkbook';
import {
  clearAllDatabase,
  loadDatabaseState,
  saveDatabaseState,
} from './storage/localDb';
import {
  ActiveView,
  AtlasDatabaseState,
  DocumentAttachmentMeta,
  Expert,
  Partner,
  Subcontractor,
} from './types/database';

const VIEW_TITLES: Record<ActiveView, string> = {
  dashboard: 'Tableau de bord',
  experts: 'Les Experts',
  subcontractors: 'Les Sous-traitants',
  partners: 'Les Partenaires',
  projects: 'Projets & Réalisations',
  workbook: 'Classeur Excel (.xlsx)',
};

interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
}

export default function App() {
  const [state, setState] = useState<AtlasDatabaseState>({
    experts: [],
    subcontractors: [],
    partners: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('experts');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);

  const [previewDoc, setPreviewDoc] = useState<{
    att: DocumentAttachmentMeta;
    expertName: string;
  } | null>(null);

  const [exportBusy, setExportBusy] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  useEffect(() => {
    let active = true;
    loadDatabaseState().then((loaded) => {
      if (!active) return;
      setState(loaded);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const persistState = async (next: AtlasDatabaseState) => {
    setState(next);
    await saveDatabaseState(next);
  };

  const availableCountries = useMemo(
    () =>
      Array.from(
        new Set([
          ...DEFAULT_COUNTRIES,
          ...state.experts.map((e) => e.country),
          ...state.subcontractors.map((s) => s.country),
          ...state.partners.map((p) => p.country),
        ])
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'fr')),
    [state]
  );

  const availableDomains = useMemo(
    () =>
      Array.from(
        new Set([
          ...DEFAULT_DOMAINS,
          ...state.experts.flatMap((e) => e.domains),
          ...state.subcontractors.flatMap((s) => s.domains),
          ...state.partners.flatMap((p) => p.domains),
        ])
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'fr')),
    [state]
  );

  const counts = useMemo(
    () => ({
      experts: state.experts.length,
      subcontractors: state.subcontractors.length,
      partners: state.partners.length,
      projects: state.experts.reduce((s, e) => s + e.projects.length, 0),
      attachments:
        state.experts.reduce((s, e) => s + e.attachments.length, 0) +
        state.subcontractors.reduce((s, sub) => s + (sub.adminDocuments?.length ?? 0), 0) +
        state.partners.reduce((s, prt) => s + (prt.adminDocuments?.length ?? 0), 0),
    }),
    [state]
  );

  // CRUD Handlers
  const handleSaveExpert = async (saved: Expert) => {
    const exists = state.experts.some((e) => e.id === saved.id);
    const nextExperts = exists
      ? state.experts.map((e) => (e.id === saved.id ? saved : e))
      : [saved, ...state.experts];
    await persistState({ ...state, experts: nextExperts });
    setExpertModalOpen(false);
    setEditingExpert(null);
    showToast(
      exists
        ? `Dossier de ${saved.firstName} ${saved.lastName} mis à jour.`
        : `Expert ${saved.firstName} ${saved.lastName} ajouté.`
    );
  };

  const handleDeleteExpert = (expertId: string) => {
    const target = state.experts.find((e) => e.id === expertId);
    if (!target) return;
    setConfirmDialog({
      title: 'Supprimer cet expert ?',
      message: `Voulez-vous supprimer ${target.firstName} ${target.lastName} (${target.code}) ainsi que son historique de projets ?`,
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        const nextExperts = state.experts.filter((e) => e.id !== expertId);
        const nextPartners = state.partners.map((p) => ({
          ...p,
          expertIds: p.expertIds.filter((id) => id !== expertId),
        }));
        await persistState({ ...state, experts: nextExperts, partners: nextPartners });
        showToast(`Expert ${target.firstName} ${target.lastName} supprimé.`);
      },
    });
  };

  const handleSaveSubcontractor = async (saved: Subcontractor) => {
    const exists = state.subcontractors.some((s) => s.id === saved.id);
    const nextSubs = exists
      ? state.subcontractors.map((s) => (s.id === saved.id ? saved : s))
      : [saved, ...state.subcontractors];
    await persistState({ ...state, subcontractors: nextSubs });
    showToast(
      exists
        ? `Sous-traitant ${saved.name} mis à jour.`
        : `Sous-traitant ${saved.name} ajouté.`
    );
  };

  const handleDeleteSubcontractor = (id: string) => {
    const target = state.subcontractors.find((s) => s.id === id);
    if (!target) return;
    setConfirmDialog({
      title: 'Supprimer ce sous-traitant ?',
      message: `Confirmer la suppression de ${target.name} (${target.code}) ?`,
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        await persistState({
          ...state,
          subcontractors: state.subcontractors.filter((s) => s.id !== id),
        });
        showToast(`Sous-traitant ${target.name} supprimé.`);
      },
    });
  };

  const handleSavePartner = async (saved: Partner) => {
    const exists = state.partners.some((p) => p.id === saved.id);
    const nextPartners = exists
      ? state.partners.map((p) => (p.id === saved.id ? saved : p))
      : [saved, ...state.partners];
    await persistState({ ...state, partners: nextPartners });
    showToast(
      exists ? `Partenaire ${saved.name} mis à jour.` : `Partenaire ${saved.name} ajouté.`
    );
  };

  const handleDeletePartner = (id: string) => {
    const target = state.partners.find((p) => p.id === id);
    if (!target) return;
    setConfirmDialog({
      title: 'Supprimer ce partenaire ?',
      message: `Confirmer la suppression de ${target.name} (${target.code}) ?`,
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        await persistState({
          ...state,
          partners: state.partners.filter((p) => p.id !== id),
        });
        showToast(`Partenaire ${target.name} supprimé.`);
      },
    });
  };

  // Excel Export & Import
  const handleExportXlsx = async () => {
    setExportBusy(true);
    try {
      await exportExcelOnly(state);
      showToast('Fichier Excel (.xlsx) généré et téléchargé.');
    } catch {
      showToast('Erreur lors de la génération du fichier .xlsx.', 'error');
    } finally {
      setExportBusy(false);
    }
  };

  const handleExportZip = async () => {
    setExportBusy(true);
    try {
      const { attachedFilesCount } = await exportFullZipBundle(state);
      showToast(
        `Pack local (.zip) généré : classeur Excel + ${attachedFilesCount} pièce(s) jointe(s).`
      );
    } catch {
      showToast('Erreur lors de la génération de l’archive .zip.', 'error');
    } finally {
      setExportBusy(false);
    }
  };

  const handleImportXlsx = async (file: File) => {
    try {
      const next = await importExcelFile(file, state);
      await persistState(next);
      showToast(
        `Classeur importé : ${next.experts.length} experts, ${next.subcontractors.length} sous-traitants, ${next.partners.length} partenaires.`
      );
    } catch {
      showToast('Impossible de lire ce fichier .xlsx. Vérifiez la structure des feuilles.', 'error');
    }
  };

  const handleClearAll = () => {
    setConfirmDialog({
      title: 'Vider toute la base locale ?',
      message:
        'Toutes les fiches Experts, Sous-traitants, Partenaires et pièces jointes stockées dans ce navigateur seront supprimées.',
      confirmLabel: 'Tout supprimer',
      onConfirm: async () => {
        const empty = await clearAllDatabase();
        setState(empty);
        showToast('Base locale vidée.');
      },
    });
  };

  const nextExpertCode = `EXP-${String(state.experts.length + 1).padStart(3, '0')}`;

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          counts={counts}
          onClearAll={handleClearAll}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar
              activeView={activeView}
              onSelectView={(v) => {
                setActiveView(v);
                setMobileMenuOpen(false);
              }}
              counts={counts}
              onClearAll={() => {
                setMobileMenuOpen(false);
                handleClearAll();
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on left, 1-2 single-line primary actions on right */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav
              aria-label="Fil d’Ariane"
              className="flex items-center gap-2 text-xs sm:text-sm min-w-0"
            >
              <span className="text-gerep-blue font-semibold whitespace-nowrap hidden sm:inline">
                GerepBase · GEREP Environnement
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-900 truncate">
                {VIEW_TITLES[activeView]}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={exportBusy}
              onClick={handleExportXlsx}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gerep-blue bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-gerep-forest" />
              Exporter .xlsx
            </button>
            <button
              type="button"
              disabled={exportBusy}
              onClick={handleExportZip}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gerep-blue rounded-lg hover:bg-gerep-blue-dark transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <FileArchive className="w-3.5 h-3.5" />
              Pack Excel (.zip)
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          {loading ? (
            <div className="space-y-4">
              <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
            </div>
          ) : (
            <>
              {activeView === 'dashboard' && (
                <DashboardView
                  state={state}
                  onNavigate={setActiveView}
                  onExportXlsx={handleExportXlsx}
                  onExportZip={handleExportZip}
                  exportBusy={exportBusy}
                />
              )}

              {activeView === 'experts' && (
                <ExpertsView
                  experts={state.experts}
                  onAddExpert={() => {
                    setEditingExpert(null);
                    setExpertModalOpen(true);
                  }}
                  onEditExpert={(exp) => {
                    setEditingExpert(exp);
                    setExpertModalOpen(true);
                  }}
                  onDeleteExpert={handleDeleteExpert}
                  onPreviewAttachment={(att, expertName) =>
                    setPreviewDoc({ att, expertName })
                  }
                />
              )}

              {activeView === 'subcontractors' && (
                <SubcontractorsView
                  subcontractors={state.subcontractors}
                  availableCountries={availableCountries}
                  availableDomains={availableDomains}
                  onSaveSubcontractor={handleSaveSubcontractor}
                  onDeleteSubcontractor={handleDeleteSubcontractor}
                  onPreviewAttachment={(att, ownerName) =>
                    setPreviewDoc({ att, expertName: ownerName })
                  }
                />
              )}

              {activeView === 'partners' && (
                <PartnersView
                  partners={state.partners}
                  experts={state.experts}
                  availableCountries={availableCountries}
                  availableDomains={availableDomains}
                  onSavePartner={handleSavePartner}
                  onDeletePartner={handleDeletePartner}
                  onOpenExpertDossier={(exp) => {
                    setEditingExpert(exp);
                    setExpertModalOpen(true);
                  }}
                  onPreviewAttachment={(att, ownerName) =>
                    setPreviewDoc({ att, expertName: ownerName })
                  }
                />
              )}

              {activeView === 'projects' && (
                <ProjectsView
                  experts={state.experts}
                  onOpenExpertDossier={(exp) => {
                    setEditingExpert(exp);
                    setExpertModalOpen(true);
                  }}
                />
              )}

              {activeView === 'workbook' && (
                <ExcelWorkbookView
                  state={state}
                  onExportXlsx={handleExportXlsx}
                  onExportZip={handleExportZip}
                  onImportXlsx={handleImportXlsx}
                  exportBusy={exportBusy}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Expert Dossier Modal */}
      {expertModalOpen && (
        <ExpertModal
          expert={editingExpert}
          availableDomains={availableDomains}
          availableCountries={availableCountries}
          availablePartnerNames={state.partners.map((p) => p.name)}
          nextCode={nextExpertCode}
          onSave={handleSaveExpert}
          onClose={() => {
            setExpertModalOpen(false);
            setEditingExpert(null);
          }}
          onPreviewAttachment={(att, expertName) =>
            setPreviewDoc({ att, expertName })
          }
        />
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          attachment={previewDoc.att}
          expertName={previewDoc.expertName}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await action();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 rounded-lg hover:bg-rose-800"
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-lg text-xs font-medium ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                toast.type === 'error' ? 'text-rose-600' : 'text-gerep-forest'
              }`}
            />
            <span>{toast.text}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 text-slate-400 hover:text-slate-700"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
