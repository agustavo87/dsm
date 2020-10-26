/**
 * Ejemplo de extensión de módulos de Quill.
 * @param Quill
 */

module.exports = function (Quill) {
    let Bold = Quill.import('formats/bold');
  Bold.tagName = 'B';   // Quill uses <strong> by default
Quill.register(Bold, true);
};
