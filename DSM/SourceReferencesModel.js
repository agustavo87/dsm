import minBy from 'lodash/minBy';

export default class SourceReferencesModel {
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
     *
     * @param Reference
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

    get first() {return this._first}

    get list() {return [...this._references]}

    _setFirst() {
        this._first =  minBy(this._references, o => o.index);
    }

    get length() {return this._references.length}

    /**
     *
     * @param j
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

    getByJ(j) {
        if (!(typeof j === 'number') || j < 0 || j > (this._references.length - 1)) {
            throw new Error('índice j es inválido (no es Number, o fuera de rango).')
        }
       return this._references[j];
    }

    get(id) {
        return this._references.find(ref => ref.id === id);
    }

    remove(id) {
        let j = this._references.findIndex(ref => ref.id === id);
        if (j > -1) {
            return this.removeByJ(j);
        } else {
            return j;
        }

    }

}
