// Convert browser KeyboardEvent into standard VT100 / ANSI terminal escape sequences

export function eventToAnsi(e) {
  if (e.ctrlKey) {
    const keyLower = e.key.toLowerCase();
    if (keyLower === 'c') return '\x03'; // Ctrl+C
    if (keyLower === 'd') return '\x04'; // Ctrl+D
    if (keyLower === 'z') return '\x1a'; // Ctrl+Z
    if (keyLower === 'l') return '\x0c'; // Ctrl+L
    if (keyLower === 'u') return '\x15'; // Ctrl+U
    if (keyLower === 'k') return '\x0b'; // Ctrl+K
    if (keyLower === 'a') return '\x01'; // Ctrl+A
    if (keyLower === 'e') return '\x05'; // Ctrl+E
  }

  switch (e.key) {
    case 'Enter':
      return '\r';
    case 'Backspace':
      return '\x7f'; // Standard PTY Backspace (ASCII 127)
    case 'Tab':
      return '\t';
    case 'Escape':
      return '\x1b';
    case 'ArrowUp':
      return '\x1b[A';
    case 'ArrowDown':
      return '\x1b[B';
    case 'ArrowRight':
      return '\x1b[C';
    case 'ArrowLeft':
      return '\x1b[D';
    case 'Home':
      return '\x1b[H';
    case 'End':
      return '\x1b[F';
    case 'Delete':
      return '\x1b[3~';
    case 'PageUp':
      return '\x1b[5~';
    case 'PageDown':
      return '\x1b[6~';
    default:
      if (e.key.length === 1 && !e.altKey && !e.metaKey) {
        return e.key;
      }
      return null;
  }
}
