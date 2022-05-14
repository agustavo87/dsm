import minBy from 'lodash/minBy';

/**
 * Model all `References` with a same `key` (source) in a `Quill` instance (document)
 * 
 * - `Refs.key`: Key (source) of the References modeled.
 * - `Refs.put(Reference)`: Puts a new Reference to be modeled.
 * - `Refs.first`: Returns the Reference that is positioned first in the document.
 * - `Refs.list`: Returns a -shallow copy- of the the list of References (unordered).
 * - `Refs.length`: Returns the length of the list of references.
 * - `Refs.removebyJ(j)`: Removes a Reference from the the model by its index in the current References model.
 * - `Refs.getByJ(j)`: Gets a Reference by its index in the current References Model.
 * - `Refs.get(id)`: Gets a Reference by its SourceBlot `id`.
 * - `Refs.remove(id)`: Removes a Reference by its SourceBlot `id`.
 */
export default class SourceReferencesModel {

    /**
     * Create the Model of the References of the Source
     * @param {string} key representing the source
     * @throws When no key provided
     */
    constructor (key) {
        if (!key) {
            throw new Error('No source Key provided')
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
     * Removes a Reference by its `j` index (it index in the list of References)
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
     * @throws {Error} When no j index provided
     */
    getByJ(j) {
        if (!(typeof j === 'number') || j < 0 || j > (this._references.length - 1)) {
            throw new Error('Invalid j index: out of range or not a number.')
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
