import {
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  FilterX,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { DEFAULT_COUNTRY } from '../data/seedData';
import { deleteAttachmentBlob, saveAttachmentBlob } from '../storage/localDb';
import { DocumentAttachmentMeta, Subcontractor } from '../types/database';

interface SubcontractorsViewProps {
  subcontractors: Subcontractor[];
  availableCountries: string[];
  availableDomains: string[];
  onSaveSubcontractor: (item: Subcontractor) => void;
  onDeleteSubcontractor: (id: string) => void;
  onPreviewAttachment: (att: DocumentAttachmentMeta, ownerName: string) => void;
}

export function SubcontractorsView({
  subcontractors,
  availableCountries,
  availableDomains,
  onSaveSubcontractor,
  onDeleteSubcontractor,
  onPreviewAttachment,
}: SubcontractorsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');

  const [editing, setEditing] = useState<Subcontractor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const countries = useMemo(
    () =>
      Array.from(new Set(subcontractors.map((s) => s.country).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'fr')
      ),
    [subcontractors]
  );

  const domains = useMemo(
    () =>
      Array.from(new Set(subcontractors.flatMap((s) => s.domains).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'fr')
      ),
    [subcontractors]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subcontractors.filter((sub) => {
      if (countryFilter !== 'all' && sub.country !== countryFilter) return false;
      if (domainFilter !== 'all' && !sub.domains.includes(domainFilter)) return false;
      if (q) {
        const hay = [
          sub.code,
          sub.name,
          sub.country,
          sub.contactName,
          sub.email,
          sub.reference,
          sub.domains.join(' '),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [subcontractors, searchQuery, countryFilter, domainFilter]);

  const openNew = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (sub: Subcontractor) => {
    setEditing(sub);
    setIsModalOpen(true);
  };

  const nextCode = `ST-${String(subcontractors.length + 1).padStart(3, '0')}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Base des Sous-traitants</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filtrage par pays et par domaines d’intervention.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gerep-blue rounded-lg hover:bg-gerep-blue-dark transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nouveau Sous-traitant
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher raison sociale, contact, référence..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
            />
          </div>

          <div>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              aria-label="Filtrer par pays"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
            >
              <option value="all">Par Pays : Tous</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              aria-label="Filtrer par domaine"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
            >
              <option value="all">Par Domaines : Tous</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="tabular-nums">
            <strong className="font-semibold text-slate-800">{filtered.length}</strong>{' '}
            sous-traitant{filtered.length > 1 ? 's' : ''} affiché
            {filtered.length > 1 ? 's' : ''} sur {subcontractors.length}
          </span>
          {(searchQuery || countryFilter !== 'all' || domainFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
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
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700">
              {subcontractors.length === 0
                ? 'La base des sous-traitants est vide.'
                : 'Aucun sous-traitant trouvé.'}
            </p>
            <p className="text-xs text-slate-500">
              {subcontractors.length === 0
                ? 'Ajoutez un sous-traitant avec ses domaines, son pays et ses documents administratifs.'
                : 'Ajustez vos filtres ou ajoutez un nouveau sous-traitant.'}
            </p>
            <button
              type="button"
              onClick={openNew}
              className="px-4 py-2 text-xs font-semibold text-white bg-gerep-blue hover:bg-gerep-blue-dark rounded-lg transition-colors"
            >
              Ajouter un sous-traitant
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Code</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Nom / Raison sociale</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Pays</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Domaines</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Référence</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Contact &amp; Coordonnées</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Documents administratifs</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Notes</th>
                  <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors align-top">
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {sub.code}
                    </td>
                    <td className="py-3 px-3 min-w-[180px]">
                      <button
                        type="button"
                        onClick={() => openEdit(sub)}
                        className="font-semibold text-slate-900 hover:text-gerep-blue text-left"
                      >
                        {sub.name}
                      </button>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {sub.country}
                    </td>
                    <td className="py-3 px-3 min-w-[200px] max-w-[260px] text-slate-700 leading-relaxed">
                      {sub.domains.length > 0 ? sub.domains.join(' · ') : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {sub.reference || '—'}
                    </td>
                    <td className="py-3 px-3 min-w-[200px] space-y-0.5">
                      <div className="font-medium text-slate-800">{sub.contactName || '—'}</div>
                      {sub.email && (
                        <a
                          href={`mailto:${sub.email}`}
                          className="block text-gerep-blue hover:underline truncate max-w-[210px]"
                        >
                          {sub.email}
                        </a>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        {sub.phone && <span className="font-mono">{sub.phone}</span>}
                        {sub.website && (
                          <a
                            href={
                              sub.website.startsWith('http')
                                ? sub.website
                                : `https://${sub.website}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:text-slate-800"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Site
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 min-w-[200px]">
                      {(sub.adminDocuments ?? []).length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {(sub.adminDocuments ?? []).map((doc) => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => onPreviewAttachment(doc, sub.name)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-gerep-forest hover:text-gerep-blue bg-emerald-50/60 hover:bg-sky-50 py-1 px-1.5 rounded transition-colors text-left max-w-[210px]"
                              title={doc.fileName}
                            >
                              <FileText className="w-3 h-3 shrink-0" />
                              <span className="truncate">{doc.fileName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 min-w-[180px] max-w-[260px] text-slate-600">
                      {sub.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(sub)}
                          className="p-1.5 text-slate-600 hover:text-gerep-blue hover:bg-emerald-50 rounded-md transition-colors"
                          title="Modifier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSubcontractor(sub.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <SubcontractorModal
          initial={editing}
          nextCode={nextCode}
          availableCountries={availableCountries}
          availableDomains={availableDomains}
          onClose={() => setIsModalOpen(false)}
          onSave={(saved) => {
            onSaveSubcontractor(saved);
            setIsModalOpen(false);
          }}
          onPreviewAttachment={onPreviewAttachment}
        />
      )}
    </div>
  );
}

interface SubcontractorModalProps {
  initial: Subcontractor | null;
  nextCode: string;
  availableCountries: string[];
  availableDomains: string[];
  onClose: () => void;
  onSave: (item: Subcontractor) => void;
  onPreviewAttachment: (att: DocumentAttachmentMeta, ownerName: string) => void;
}

function SubcontractorModal({
  initial,
  nextCode,
  availableCountries,
  availableDomains,
  onClose,
  onSave,
  onPreviewAttachment,
}: SubcontractorModalProps) {
  const [code, setCode] = useState(initial?.code ?? nextCode);
  const [name, setName] = useState(initial?.name ?? '');
  const [country, setCountry] = useState(initial?.country ?? DEFAULT_COUNTRY);
  const [domains, setDomains] = useState<string[]>(initial?.domains ?? []);
  const [customDomain, setCustomDomain] = useState('');
  const [contactName, setContactName] = useState(initial?.contactName ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [website, setWebsite] = useState(initial?.website ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [reference, setReference] = useState(initial?.reference ?? '');
  const [adminDocuments, setAdminDocuments] = useState<DocumentAttachmentMeta[]>(
    initial?.adminDocuments ?? []
  );
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const allDomainChoices = Array.from(new Set([...availableDomains, ...domains])).sort((a, b) =>
    a.localeCompare(b, 'fr')
  );

  const toggleDomain = (d: string) => {
    setDomains((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingDocs(true);
    try {
      const added: DocumentAttachmentMeta[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const attId = `att-sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        await saveAttachmentBlob(attId, file);
        added.push({
          id: attId,
          category: 'administratif',
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
        });
      }
      setAdminDocuments((prev) => [...prev, ...added]);
    } finally {
      setUploadingDocs(false);
      e.target.value = '';
    }
  };

  const handleRemoveDocument = async (docId: string) => {
    await deleteAttachmentBlob(docId);
    setAdminDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !country.trim()) return;
    onSave({
      id: initial?.id ?? `sub-${Date.now()}`,
      code: code.trim() || nextCode,
      name: name.trim(),
      country: country.trim(),
      domains,
      contactName: contactName.trim(),
      email: email.trim(),
      website: website.trim(),
      phone: phone.trim(),
      reference: reference.trim(),
      adminDocuments,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-500">{code}</div>
            <h2 className="text-base font-semibold text-slate-900">
              {initial ? `Modifier Sous-traitant — ${initial.name}` : 'Nouveau Sous-traitant'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nom / Raison sociale *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Pays *</label>
              <input
                type="text"
                required
                list="sub-countries-list"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
              />
              <datalist id="sub-countries-list">
                {availableCountries.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Contact principal
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Référence</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Site web</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">Domaines</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allDomainChoices.map((d) => {
                const checked = domains.includes(d);
                return (
                  <label
                    key={d}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer ${
                      checked
                        ? 'border-gerep-blue bg-sky-50/60 text-gerep-blue font-medium'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDomain(d)}
                      className="accent-gerep-blue"
                    />
                    <span className="truncate">{d}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex items-center gap-2 max-w-sm pt-1">
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="Autre domaine..."
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
              />
              <button
                type="button"
                onClick={() => {
                  const t = customDomain.trim();
                  if (t && !domains.includes(t)) setDomains((p) => [...p, t]);
                  setCustomDomain('');
                }}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                + Ajouter
              </button>
            </div>
          </div>

          {/* Documents administratifs */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Documents administratifs
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  RC, patente, attestations fiscales/CNSS, statuts · {adminDocuments.length}{' '}
                  fichier{adminDocuments.length > 1 ? 's' : ''} attaché
                  {adminDocuments.length > 1 ? 's' : ''}
                </div>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gerep-blue bg-white border border-slate-200 rounded-lg hover:bg-sky-50 cursor-pointer transition-colors whitespace-nowrap">
                <Upload className="w-3.5 h-3.5" />
                {uploadingDocs ? 'Envoi...' : 'Joindre'}
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            </div>

            {adminDocuments.length === 0 ? (
              <div className="text-xs text-slate-400 py-2 border-t border-slate-200/80">
                Aucun document administratif attaché.
              </div>
            ) : (
              <ul className="space-y-1.5 border-t border-slate-200/80 pt-2">
                {adminDocuments.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-2 bg-white px-2.5 py-2 rounded-md border border-slate-200 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 truncate">{doc.fileName}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {(doc.fileSize / 1024).toFixed(1)} Ko
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onPreviewAttachment(doc, name.trim() || code)}
                        className="p-1.5 text-slate-600 hover:text-gerep-blue hover:bg-sky-50 rounded transition-colors"
                        title="Aperçu / Télécharger"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-semibold text-white bg-gerep-blue rounded-lg hover:bg-gerep-blue-dark"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
