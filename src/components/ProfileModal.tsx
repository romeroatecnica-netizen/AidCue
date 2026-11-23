import React, {useRef, useState} from 'react';
import {Award, Download, Plus, Trash2, Upload, X} from 'lucide-react';
import type {UiStrings} from '../i18n/uiStrings';
import type {ProfileData, ProfileStore} from '../types';
import {exportProfileJson, parseImportedProfileJson} from '../utils/storage';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  store: ProfileStore;
  activeProfile: ProfileData;
  ui: UiStrings;
  onSwitchProfile: (id: string) => void;
  onCreateProfile: (name: string) => void;
  onRenameProfile: (id: string, nextName: string) => void;
  onDeleteProfile: (id: string) => void;
  onImportProfile: (profile: ProfileData) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  open,
  onClose,
  store,
  activeProfile,
  ui,
  onSwitchProfile,
  onCreateProfile,
  onRenameProfile,
  onDeleteProfile,
  onImportProfile,
}) => {
  const [newName, setNewName] = useState('');
  const [renameDraft, setRenameDraft] = useState(activeProfile.name);
  const [statusMsg, setStatusMsg] = useState<{ok: boolean; text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const handleExport = () => {
    const json = exportProfileJson(activeProfile);
    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aidcue-profile-${activeProfile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const result = parseImportedProfileJson(content);
      if (result.ok) {
        onImportProfile(result.profile);
        setRenameDraft(result.profile.name);
        setStatusMsg({ok: true, text: ui.profileImportSuccess});
      } else {
        setStatusMsg({ok: false, text: ui.profileImportError});
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const badgeEntries = Object.entries(ui.badges);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ui.profileModalTitle}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="font-display text-lg font-bold text-slate-900">
            {ui.profileModalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={ui.closeLabel}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Active Stats Row */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{ui.profileXpLabel}</div>
            <div className="mt-0.5 font-display text-xl font-extrabold text-slate-900 tabular-nums">
              {activeProfile.xp}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{ui.profileStreakLabel}</div>
            <div className="mt-0.5 font-display text-xl font-extrabold text-emerald-600 tabular-nums">
              {activeProfile.streakDays}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{ui.profileProtocolsLabel}</div>
            <div className="mt-0.5 font-display text-xl font-extrabold text-blue-700 tabular-nums">
              {activeProfile.reviewedProtocols.length}/8
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{ui.profileScenariosLabel}</div>
            <div className="mt-0.5 font-display text-xl font-extrabold text-red-600 tabular-nums">
              {Object.keys(activeProfile.completedScenarios).length}
            </div>
          </div>
        </div>

        {/* Profile Switcher & Rename */}
        <div className="mt-5 space-y-3">
          <div className="text-xs font-bold text-slate-500">{ui.profileActiveLabel}</div>
          <div className="flex flex-wrap gap-2">
            {store.profiles.map((p) => {
              const active = p.id === activeProfile.id;
              return (
                <div
                  key={p.id}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchProfile(p.id);
                      setRenameDraft(p.name);
                    }}
                    className="px-1"
                  >
                    {p.name}
                  </button>
                  {store.profiles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteProfile(p.id)}
                      aria-label={ui.profileDeleteBtn}
                      className={`rounded p-0.5 ${
                        active ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rename Active Profile */}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (renameDraft.trim()) {
                onRenameProfile(activeProfile.id, renameDraft.trim());
              }
            }}
          >
            <input
              type="text"
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              {ui.profileRenameBtn}
            </button>
          </form>

          {/* Create New Profile */}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (newName.trim()) {
                onCreateProfile(newName.trim());
                setRenameDraft(newName.trim());
                setNewName('');
              }
            }}
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={ui.profileCreatePlaceholder}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{ui.profileCreateBtn}</span>
            </button>
          </form>
        </div>

        {/* JSON Export & Import */}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            <span>{ui.profileExportBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            <Upload className="h-4 w-4" />
            <span>{ui.profileImportBtn}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileImport}
            className="hidden"
          />

          {statusMsg && (
            <span
              className={`text-xs font-semibold ${
                statusMsg.ok ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {statusMsg.text}
            </span>
          )}
        </div>

        {/* Earned Milestones / Badges */}
        <div className="mt-6 border-t border-slate-200 pt-4">
          <h3 className="text-xs font-bold text-slate-500 mb-3">
            {ui.profileBadgesHeading} ({activeProfile.earnedBadges.length}/{badgeEntries.length})
          </h3>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {badgeEntries.map(([id, badge]) => {
              const earned = activeProfile.earnedBadges.includes(id);
              return (
                <div
                  key={id}
                  className={`rounded-xl border p-3 ${
                    earned
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-slate-200 bg-slate-50/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Award
                      className={`h-4 w-4 shrink-0 ${
                        earned ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{badge.title}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-600">
                    {badge.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
