import { MessageSquarePlus, StickyNote } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAddServiceNote } from '../hooks/useServiceActions';
import type { Service } from '../types';
import { formatDateTime } from '../utils/format';
import { Button } from './Button';

const MAX_NOTE = 1000;

interface ServiceNotesProps {
  service: Service;
  canAdd: boolean;
}

export function ServiceNotes({ service, canAdd }: ServiceNotesProps) {
  const [text, setText] = useState('');
  const addNote = useAddServiceNote(() => setText(''));
  const trimmed = text.trim();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed || trimmed.length > MAX_NOTE) return;
    addNote.mutate({ id: service.id, text: trimmed });
  };

  return (
    <div className="space-y-3">
      {service.notes.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <StickyNote className="h-4 w-4" aria-hidden="true" /> No notes yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {service.notes.map((note) => (
            <li key={note.id} className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{note.text}</p>
              <p className="mt-1 text-xs text-slate-500">
                {note.author?.name ?? 'Unknown'} · {formatDateTime(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <form onSubmit={submit} className="space-y-2">
          <label htmlFor={`note-${service.id}`} className="sr-only">
            Add a note
          </label>
          <textarea
            id={`note-${service.id}`}
            className="input min-h-[72px] resize-y"
            placeholder="Add a note about the work done…"
            value={text}
            maxLength={MAX_NOTE}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs tabular-nums text-slate-400">
              {text.length}/{MAX_NOTE}
            </span>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              loading={addNote.isPending}
              disabled={!trimmed}
              icon={<MessageSquarePlus className="h-3.5 w-3.5" />}
            >
              Add note
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
