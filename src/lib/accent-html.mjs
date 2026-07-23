// Renders content strings from src/data/pages/*: escapes HTML, converts
// [[...]] markers to an accent tag and \n to <br/>.
const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export const accentHtml = (value = '', tag = '<span class="accent">$1</span>') => escapeHtml(value)
  .replace(/\[\[([\s\S]*?)\]\]/g, tag)
  .replaceAll('\n', '<br/>');

export const strongHtml = (value = '') => accentHtml(value, '<strong>$1</strong>');
