import { useState } from 'react';
import { colors, spacing, radius, getCardStyle, getButtonStyle } from './appStyles';

export function NotesModule({ allData = {}, onSave }) {
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');

  const addNote = () => {
    if (!newNoteText.trim()) return;
    const newNote = {
      id: Date.now(),
      text: newNoteText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes([newNote, ...notes]);
    setNewNoteText('');
  };

  const updateNote = (id, text) => {
    setNotes(notes.map(n => n.id === id ? { ...n, text, updatedAt: new Date().toISOString() } : n));
    setEditingNote(null);
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ padding: `${spacing.xl}px`, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: spacing.xxl }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary, marginBottom: spacing.lg }}>
          📝 Anotações
        </h2>
      </div>

      {/* Input Nova Nota */}
      <div style={{ ...getCardStyle(), padding: spacing.lg, marginBottom: spacing.xxl }}>
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Escreva uma anotação..."
          style={{
            width: '100%',
            minHeight: 100,
            background: colors.bgCard,
            border: `1px solid rgba(255,255,255,0.06)`,
            borderRadius: radius.md,
            color: colors.textPrimary,
            padding: spacing.md,
            fontSize: 13,
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            outline: 'none',
            marginBottom: spacing.md,
            resize: 'vertical',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              addNote();
            }
          }}
        />
        <div style={{ display: 'flex', gap: spacing.md }}>
          <button
            onClick={addNote}
            style={{ ...getButtonStyle('primary'), flex: 1 }}>
            ➕ Adicionar Nota
          </button>
          <button
            onClick={() => setNewNoteText('')}
            style={{ ...getButtonStyle('secondary'), flex: 1 }}>
            Limpar
          </button>
        </div>
      </div>

      {/* Lista de Notas */}
      {notes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: spacing.xxl,
          color: colors.textTertiary,
          background: colors.bgCard,
          borderRadius: radius.lg,
          border: `1px solid rgba(255,255,255,0.06)`,
        }}>
          <div style={{ fontSize: 14, marginBottom: spacing.md }}>Nenhuma anotação ainda</div>
          <div style={{ fontSize: 12 }}>Comece escrevendo uma anotação acima! 👆</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: spacing.lg }}>
          {notes.map(note => (
            <div
              key={note.id}
              style={{
                ...getCardStyle(),
                padding: spacing.lg,
                position: 'relative',
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
              }}>
              {editingNote === note.id ? (
                <>
                  <textarea
                    value={note.text}
                    onChange={(e) => {
                      setNotes(notes.map(n => n.id === note.id ? { ...n, text: e.target.value } : n));
                    }}
                    style={{
                      flex: 1,
                      background: colors.bgCard,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: radius.md,
                      color: colors.textPrimary,
                      padding: spacing.md,
                      fontSize: 13,
                      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                      outline: 'none',
                      marginBottom: spacing.md,
                      resize: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    <button
                      onClick={() => updateNote(note.id, note.text)}
                      style={{ ...getButtonStyle('primary'), fontSize: 11, flex: 1, padding: `${spacing.sm}px` }}>
                      ✓ Salvar
                    </button>
                    <button
                      onClick={() => setEditingNote(null)}
                      style={{ ...getButtonStyle('secondary'), fontSize: 11, flex: 1, padding: `${spacing.sm}px` }}>
                      ✕ Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    flex: 1,
                    color: colors.textSecondary,
                    fontSize: 13,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    marginBottom: spacing.lg,
                  }}>
                    {note.text}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: colors.textTertiary,
                    marginBottom: spacing.md,
                    paddingTop: spacing.md,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {formatDate(note.updatedAt)}
                  </div>
                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    <button
                      onClick={() => setEditingNote(note.id)}
                      style={{ ...getButtonStyle('secondary'), fontSize: 11, flex: 1, padding: `${spacing.sm}px` }}>
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      style={{ ...getButtonStyle('secondary'), fontSize: 11, flex: 1, padding: `${spacing.sm}px`, borderColor: 'rgba(239, 68, 68, 0.3)', color: colors.error }}>
                      🗑️ Deletar
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
