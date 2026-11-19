import {
  Eye,
  FilePlus2,
  FolderPlus,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useState } from 'react';
import {
  deleteAttachmentBlob,
  saveAttachmentBlob,
} from '../storage/localDb';
import {
  DOCUMENT_CATEGORY_LABELS,
  DocumentAttachmentMeta,
  DocumentCategory,
  Expert,
  ExpertProject,
  ExpertScope,
} from '../types/database';

interface ExpertModalProps {
  expert: Expert | null;
  availableDomains: string[];
  availableCountries: string[];
  availablePartnerNames: string[];
  nextCode: string;
  onSave: (expert: Expert) => void;
  onClose: () => void;
  onPreviewAttachment: (att: DocumentAttachmentMeta, expertName: string) => void;
}

const CATEGORIES: DocumentCategory[] = ['diplome', 'cv', 'reference', 'certificat'];

export function ExpertModal({
  expert,
  availableDomains,
  availableCountries,
  availablePartnerNames,
  nextCode,
  onSave,
  onClose,
  onPreviewAttachment,
}: ExpertModalProps) {
  const [code, setCode] = useState(expert?.code ?? nextCode);
  const [lastName, setLastName] = useState(expert?.lastName ?? '');
  const [firstName, setFirstName] = useState(expert?.firstName ?? '');
  const [scope, setScope] = useState<ExpertScope>(expert?.scope ?? 'International');
  const [nationality, setNationality] = useState(expert?.nationality ?? '');
  const [country, setCountry] = useState(expert?.country ?? availableCountries[0] ?? '');
  const [domains, setDomains] = useState<string[]>(expert?.domains ?? []);
  const [customDomain, setCustomDomain] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number>(
    expert?.yearsExperience ?? 5
  );
  const [reference, setReference] = useState(expert?.reference ?? '');
  const [email, setEmail] = useState(expert?.email ?? '');
  const [website, setWebsite] = useState(expert?.website ?? '');
  const [notes, setNotes] = useState(expert?.notes ?? '');
  const [attachments, setAttachments] = useState<DocumentAttachmentMeta[]>(
    expert?.attachments ?? []
  );
  const [projects, setProjects] = useState<ExpertProject[]>(expert?.projects ?? []);

  // New project quick state
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjYear, setNewProjYear] = useState<number>(new Date().getFullYear());
  const [newProjCountry, setNewProjCountry] = useState(
    expert?.country ?? availableCountries[0] ?? ''
  );
  const [newProjDomain, setNewProjDomain] = useState(
    expert?.domains[0] ?? availableDomains[0] ?? ''
  );
  const [newProjPartner, setNewProjPartner] = useState('');

  const [uploadingCat, setUploadingCat] = useState<DocumentCategory | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const allDomainChoices = Array.from(new Set([...availableDomains, ...domains])).sort((a, b) =>
    a.localeCompare(b, 'fr')
  );

  const toggleDomain = (domain: string) => {
    setDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const handleAddCustomDomain = () => {
    const trimmed = customDomain.trim();
    if (!trimmed) return;
    if (!domains.includes(trimmed)) {
      setDomains((prev) => [...prev, trimmed]);
    }
    setCustomDomain('');
  };

  const handleFileUpload = async (
    category: DocumentCategory,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingCat(category);
    try {
      const added: DocumentAttachmentMeta[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const attId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        await saveAttachmentBlob(attId, file);
        added.push({
          id: attId,
          category,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
        });
      }
      setAttachments((prev) => [...prev, ...added]);
    } finally {
      setUploadingCat(null);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = async (attId: string) => {
    await deleteAttachmentBlob(attId);
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleAddProject = () => {
    const title = newProjTitle.trim();
    if (!title) return;
    const newItem: ExpertProject = {
      id: `prj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      completionYear: Number(newProjYear) || new Date().getFullYear(),
      country: newProjCountry.trim() || country || '—',
      domain: newProjDomain.trim() || domains[0] || '—',
      partnerName: newProjPartner.trim() || undefined,
      referenceCode: reference.trim() || undefined,
    };
    setProjects((prev) => [newItem, ...prev]);
    setNewProjTitle('');
    setNewProjPartner('');
  };

  const handleRemoveProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!lastName.trim() || !firstName.trim()) {
      setErrorMsg('Le nom et le prénom de l’expert sont obligatoires.');
      return;
    }
    if (!country.trim()) {
      setErrorMsg('Veuillez renseigner le pays.');
      return;
    }

    const saved: Expert = {
      id: expert?.id ?? `exp-${Date.now()}`,
      code: code.trim() || nextCode,
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      scope,
      nationality: nationality.trim(),
      country: country.trim(),
      domains,
      yearsExperience: Math.max(0, Number(yearsExperience) || 0),
      reference: reference.trim(),
      email: email.trim(),
      website: website.trim(),
      attachments,
      projects,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSave(saved);
  };

  const displayName = `${firstName || 'Nouvel'} ${lastName || 'Expert'}`.trim();

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-white">
          <div>
            <div className="text-xs text-slate-500 font-mono">{code}</div>
            <h2 className="text-lg font-semibold text-slate-900">
              {expert ? `Dossier Expert — ${expert.firstName} ${expert.lastName}` : 'Ajouter un Expert'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Identité & Qualification */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-200">
              01. Identité, Portée &amp; Coordonnées
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ex: Ben Salah"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: Karim"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Portée (International / Nationale)
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['International', 'Nationale'] as ExpertScope[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setScope(opt)}
                      className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        scope === opt
                          ? 'bg-white text-gerep-blue shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nationalité
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Ex: Tunisienne, Française..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pays *
                </label>
                <input
                  type="text"
                  required
                  list="expert-countries-list"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Sélectionner ou saisir..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                />
                <datalist id="expert-countries-list">
                  {availableCountries.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Années d’expérience
                </label>
                <input
                  type="number"
                  min={0}
                  max={65}
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="expert@domaine.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Site web
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Référence
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: REF-BAD-2024-01"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                />
              </div>
            </div>

            {/* Domaines multi-select */}
            <div className="pt-2 space-y-2">
              <label className="block text-xs font-medium text-slate-700">
                Domaines d’expertise ({domains.length} sélectionné{domains.length > 1 ? 's' : ''})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {allDomainChoices.map((dom) => {
                  const checked = domains.includes(dom);
                  return (
                    <label
                      key={dom}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        checked
                          ? 'border-gerep-blue bg-sky-50/60 text-gerep-blue font-medium'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDomain(dom)}
                        className="accent-gerep-blue rounded"
                      />
                      <span className="truncate">{dom}</span>
                    </label>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 pt-1 max-w-md">
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="Ajouter un autre domaine..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                />
                <button
                  type="button"
                  onClick={handleAddCustomDomain}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  + Ajouter
                </button>
              </div>
            </div>
          </section>

          {/* Section 2: Attachements des documents */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                02. Attachements des documents (Diplôme, CV, Référence, Certificat / Attestations)
              </h3>
              <span className="text-xs text-slate-500">
                Stockés localement &amp; inclus dans le Pack ZIP Excel
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CATEGORIES.map((cat) => {
                const items = attachments.filter((a) => a.category === cat);
                return (
                  <div
                    key={cat}
                    className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {DOCUMENT_CATEGORY_LABELS[cat]}
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          {items.length} fichier{items.length > 1 ? 's' : ''} attaché
                          {items.length > 1 ? 's' : ''}
                        </div>
                      </div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gerep-blue bg-white border border-slate-200 rounded-lg hover:bg-sky-50 cursor-pointer transition-colors whitespace-nowrap">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingCat === cat ? 'Envoi...' : 'Joindre'}
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt"
                          onChange={(e) => handleFileUpload(cat, e)}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    {items.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2 border-t border-slate-200/80">
                        Aucun document attaché pour cette catégorie.
                      </div>
                    ) : (
                      <ul className="space-y-1.5 border-t border-slate-200/80 pt-2">
                        {items.map((att) => (
                          <li
                            key={att.id}
                            className="flex items-center justify-between gap-2 bg-white px-2.5 py-2 rounded-md border border-slate-200 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-slate-800 truncate">
                                {att.fileName}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                                {(att.fileSize / 1024).toFixed(1)} Ko
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onPreviewAttachment(att, displayName)}
                                className="p-1.5 text-slate-600 hover:text-gerep-blue hover:bg-sky-50 rounded transition-colors"
                                title="Aperçu / Télécharger"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(att.id)}
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
                );
              })}
            </div>
          </section>

          {/* Section 3: Projets réalisés ensemble & Année d'achèvement */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-200">
              03. Projets réalisés ensemble &amp; Année d’achèvement
            </h3>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Intitulé du projet réalisé avec nous
                  </label>
                  <input
                    type="text"
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                    placeholder="Ex: Schéma Directeur AEP..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Année d’achèvement
                  </label>
                  <input
                    type="number"
                    min={1980}
                    max={2035}
                    value={newProjYear}
                    onChange={(e) => setNewProjYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pays
                  </label>
                  <input
                    type="text"
                    value={newProjCountry}
                    onChange={(e) => setNewProjCountry(e.target.value)}
                    placeholder="Pays"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Partenaire
                  </label>
                  <input
                    type="text"
                    list="proj-partners-list"
                    value={newProjPartner}
                    onChange={(e) => setNewProjPartner(e.target.value)}
                    placeholder="Optionnel"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                  />
                  <datalist id="proj-partners-list">
                    {availablePartnerNames.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-gerep-blue rounded-lg hover:bg-gerep-blue-dark transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter projet
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Domaine du projet
                  </label>
                  <input
                    type="text"
                    list="proj-domains-list"
                    value={newProjDomain}
                    onChange={(e) => setNewProjDomain(e.target.value)}
                    placeholder="Domaine..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
                  />
                  <datalist id="proj-domains-list">
                    {allDomainChoices.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-slate-400" />
                Aucun projet enregistré pour cet expert. Utilisez le formulaire ci-dessus pour ajouter un projet et son année d’achèvement.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="py-2.5 px-3 font-medium">Projet</th>
                      <th className="py-2.5 px-3 font-medium">Année d’achèvement</th>
                      <th className="py-2.5 px-3 font-medium">Pays</th>
                      <th className="py-2.5 px-3 font-medium">Domaine</th>
                      <th className="py-2.5 px-3 font-medium">Partenaire</th>
                      <th className="py-2.5 px-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {projects.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{p.title}</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700">
                          {p.completionYear}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{p.country}</td>
                        <td className="py-2.5 px-3 text-slate-600">{p.domain}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {p.partnerName ?? '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveProject(p.id)}
                            className="p-1 text-slate-400 hover:text-rose-700 rounded"
                            title="Retirer ce projet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Notes */}
          <section className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              Notes complémentaires (optionnel)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Langues parlées, disponibilité, tarif indicatif..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-gerep-blue"
            />
          </section>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <FilePlus2 className="w-4 h-4 text-slate-400" />
            <span>
              {attachments.length} document{attachments.length > 1 ? 's' : ''} ·{' '}
              {projects.length} projet{projects.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-semibold text-white bg-gerep-blue rounded-lg hover:bg-gerep-blue-dark transition-colors"
            >
              Enregistrer l’expert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
