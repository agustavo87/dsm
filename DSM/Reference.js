// import Quill from 'quill';
import SourceBlot from '../quill/blots/source';

/**
 * A wrapper to handle SourceBlots info.
 */
export default class Reference {

    /**
     * Creates Reference from SourceBlot.
     * 
     * @param {SourceBlot} blot
     * @param {Quill} quill instance. It's recomended specify on construction
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

            /**
             * @todo arrojaría error porque Reference puede ser 'null' (como lo es),
             *  debería chequearse que Reference.quill sea válida.
             */

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
/** Default quill instance */
Reference.quill = null;
