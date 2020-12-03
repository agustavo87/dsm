import minBy from 'lodash/minBy';

/**
 * Model the References in the document (SourceBlots) to a common Source (Key)
 */
export default class SourceReferencesModel {

    /**
     * Create the Model of the References of the Source
     * @param {string} key representing the source
     */
    constructor (key) {
        if (!key) {
            throw new Error('Debe suministrarse una clave de construcción')
        }
        this._key = String(key);
        this._references = [];
        this._first = null;
    }

    get key() {
        return this._key;
    }

    /**
     * Adds a new reference to the model.
     * 
     * @param {Reference} Reference to the source key of this model
     * @returns {boolean} true if first
     */
    put(Reference) {
        if (!this._first) {
            this._first = Reference;
            this._references.push(Reference);
            return true;
        } else if (Reference.index < this._first.index) {
            this._first = Reference;
            this._references.push(Reference);
            return true;
        }
        this._references.push(Reference);
        return false;
    }

    /**
     * Returns the Reference with the minor index in the document.
     * 
     * @returns {Reference}
     */
    get first() {return this._first}

    /**
     * Returns an unordened lists of references.
     * 
     * @returns {Array.<Reference>}
     */
    get list() {return [...this._references]}

    _setFirst() {
        this._first =  minBy(this._references, o => o.index);
    }

    /**
     * Returns the number of References of this Source
     * 
     * @returns {number}
     */
    get length() {return this._references.length}

    /**
     * Removes a Reference by its j index (it index in the list of References
     * of the same source in this model)
     * 
     * @param {number} j
     * @returns {boolean} true if first.
     */
    removeByJ(j) {
        if (this._references[j] === this._first) {
            this._references.splice(j,1);
            this._setFirst();
            return true;
        }
        this._references.splice(j,1);
        return false;
    }

    /**
     * Get a Reference object from the list.
     * 
     * @param {number} j index in the References list in this model.
     * @returns {Reference} 
     * @throws {Error}
     */
    getByJ(j) {
        if (!(typeof j === 'number') || j < 0 || j > (this._references.length - 1)) {
            throw new Error('índice j es inválido (no es Number, o fuera de rango).')
        }
       return this._references[j];
    }

    /**
     * Get a reference by the id number of the SourceBlot.
     * 
     * @param {number} id of the SourceBlot of the Reference
     * @returns {Reference}
     */
    get(id) {
        return this._references.find(ref => ref.id === id);
    }

    /**
     * Remove a Reference from the model by a SourceBlot id.
     * 
     * @param {number} id The SourceBlot id of the Reference to remove.
     * @returns {(boolean|number)} Boolean representing if is a 'First'
     * Reference. Or -1 if the reference was not found.
     */
    remove(id) {
        let j = this._references.findIndex(ref => ref.id === id);
        if (j > -1) {
            return this.removeByJ(j);
        } else {
            return j;
        }

    }

}
