import SourceBlot from '../quill/blots/source';

/**
 * Un Wrapper que brinda funciones útiles para administrar
 * SourceBlots
 */
export default class Reference {
    /**
     * Crea una Referencia a partir de un SourceBlot de Quill.
     * @param blot El SourceBlot a usarse como Referencia
     * @param quill Se recomienda siempre especificar! De lo contrario se utiliza el valor
     * establecido por defecto en Reference.quill.
     */
    constructor (blot = false, quill = false) {
        if (!(blot instanceof SourceBlot)) {
            throw new Error('El blot suministrado no es un SourceBlot válido')
        }
        if(quill) { // se recomienda siempre especificar la referencia a quill.
            this.quill = quill;
        } else if (Reference.quill) { // Por defecto
            // no se recomienda, debido a que si hay multiples instancias de quill en
            // un mismo proceso de ejecución, van reemplazarse.
            this.quill = Reference.quill;
        } else {
            throw new Error('No se inyectado referencia a instancia de Quill');
        }

        this.quill = quill ? quill : Reference.quill;
        this._blot = blot;
    }

    get index() {
        // if (this.quill === null) {
        //     throw new Error('No se inyectado referencia a instancia de Quill');
        // }
        return this.quill.getIndex(this._blot);
    }

    get blot() {
        return this._blot;
    }

    get key() {
        return this._blot.domNode.dataset.key;
    }

    get type() {
        return this._blot.domNode.dataset.type;
    }

    get id() {
        return this._blot.id;
    }
}
Reference.quill = null;
