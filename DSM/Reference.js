import SourceBlot from '../quill/blots/source';

/**
 * A wrapper to handle `SourceBlots` info.
 * - `myRef.key`: Key of the reference
 * - `myRef.type`: Type of the reference
 * - `myRef.index`: Index of the blot in the specified quill instance.
 * - `myRef.id`: Id of the reference
 * - `myRef.blot`: SourceBlot wrapped
 */
class Reference {
    /**
     * Creates Reference from SourceBlot.
     * 
     * @param {SourceBlot} blot
     * @param {Quill} quill instance to get index from. It's recomended specify on construction.
     * @throws Will trhow error if quill is not inyected in the class or passed as argument.
     */
    constructor (blot = false, quill = null) {
        if (!(blot instanceof SourceBlot)) {
            throw new Error('No valid SourceBlot.')
        }
        if(!quill && !Reference.quill) { // se recomienda siempre especificar la referencia a quill.
            throw new Error('No valid quill instance available.');
        }

        this.quill = quill ?? Reference.quill;
        this._blot = blot;
    }

    /**
     * Index of the blot in the specified quill instance
     * @returns {number}
     */
    get index() {
        return this.quill.getIndex(this._blot);
    }

    /**
     * Wrapped blot 
     * @returns {SourceBlot}
     */
    get blot() {
        return this._blot;
    }

    /** 
     * Key of the Reference 
     * @returns {string}
     */
    get key() {
        return this._blot.domNode.dataset.key;
    }

    /** 
     * Type of the Reference 
     * @returns {string}
     */
    get type() {
        return this._blot.domNode.dataset.type;
    }

    /** 
     * The id of the Reference
     * @returns {number} 
    */
    get id() {
        return this._blot.id;
    }
}

/** Default quill instance */
Reference.quill = null;

export default Reference;
